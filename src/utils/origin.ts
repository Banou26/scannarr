import type { OriginCtx, ServerContext } from '../urql/server'

import { combineLatest, from } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { gql } from 'graphql-tag'
import { Handle, HandleRelation, ResolversTypes, SubscriptionResolverObject, SubscriptionResolvers } from '../generated/graphql'
import { makeScannarrHandle2 } from '../urql'
import { Graph, InMemoryGraphDatabase, recursiveRemoveNullable } from '../urql/graph'
import { merge } from './deep-merge'
import { keyResolvers } from '../urql/client'

type KeyResolvers = typeof keyResolvers
type KeyResolversMap = {
  [K in keyof KeyResolvers]: Exclude<KeyResolvers[K], (...args: any) => null>
}

type NullKeyResolvers = {
  [K in keyof KeyResolversMap]: KeyResolversMap[K] extends never ? K : never
}[keyof KeyResolversMap]

type KeyResolverHandler = {
  [K in Exclude<keyof KeyResolversMap, NullKeyResolvers>]: Exclude<KeyResolvers[K], (...args: any) => null>
}


type HandleResolvers = {
  [K in keyof KeyResolverHandler]: Awaited<ResolversTypes[K]>
}

type HandleTypename = NonNullable<HandleResolvers[keyof HandleResolvers]['__typename']>

export type Handle2 = HandleResolvers[keyof HandleResolvers]

type ExtractHandleType<T> =
  T extends Handle2 ? T :
  T extends Array<infer U> ? ExtractHandleType<U>[] :
  T extends object ? { [key in keyof T]: ExtractHandleType<T[key]> }[keyof T] :
  never

const handleTypeNames =
  Object
    .entries(keyResolvers)
    .filter(([, resolver]) => resolver({ uri: 'foo:bar' }) === 'foo:bar')
    .map(([key]) => key) as HandleTypename[]

export const getNodeId = (handle: Handle2) =>
  `${handle.__typename}:${keyResolvers[handle.__typename!](handle)}`

export const getHandles = <T>(value: T): ExtractHandleType<T> => {
  const handlesMap = new Map<string, Handle2>()

  const recurse = (value: any) => {
    if (!value) return

    if (Array.isArray(value)) return value.map(recurse)

    if (handleTypeNames.includes(value.__typename)) {
      const key = `${value.__typename}:${value.uri}`
      const existingHandle = handlesMap.get(key)
      if (existingHandle) {
        handlesMap.set(key, merge(existingHandle, recursiveRemoveNullable(value)) as Handle2)
        return
      }
      handlesMap.set(key, value)
      Object
        .values(value)
        .map(recurse)
      return
    }

    if (typeof value === 'object') {
      Object
        .values(value)
        .map(recurse)
    }
  }

  recurse(value)
  return [...handlesMap.values()] as ExtractHandleType<T>
}

type SubscriptionResolverValue<T extends keyof SubscriptionResolvers> =
  Extract<
      Awaited<
        ReturnType<
          ReturnType<
            Awaited<
              ReturnType<
                Exclude<
                  ReturnType<
                    Extract<
                      SubscriptionResolvers[T],
                      Function
                    >
                  >,
                  SubscriptionResolverObject<any, any, any, any>
                >['subscribe']
              >
            >[typeof Symbol['asyncIterator']]
          >['next']
        >
      >,
      IteratorYieldResult<any>
    >['value']

// todo: check why this isnt valid, probably some TS dark magic
// @ts-expect-error
type SubscriptionResolverInnerValue<T extends keyof SubscriptionResolvers> = SubscriptionResolverValue<T>[T]

type SubscriptionResolverHandleValue<T extends keyof SubscriptionResolvers> = Awaited<SubscriptionResolverInnerValue<T>>

export const subscribeToOrigins = <T extends keyof SubscriptionResolvers>(
  { graph, name, context, origins }:
  { graph: InMemoryGraphDatabase, name: T, context: ServerContext, origins: OriginCtx[] }
) =>
  combineLatest(
    ...origins
      .map(origin =>
        from(
          origin
            .client
              .subscription<SubscriptionResolverValue<T>>(
                gql([context.params.query]),
                context.params.variables
              )
        )
        .pipe(
          map(result =>
            result.error?.message === '[Network] No Content'
              ? { ...result, data: { [name]: null } as { [K in T]: null }, error: undefined, origin }
              : { ...result, origin }
          ),
          tap(result => {
            console.log('AAAAAAAAAAAA', result)
            if (result.error) {
              console.warn('Error in origin', result.origin.origin.name)
              console.error(result.error)
            } else if (result.data) {
              try {
                const handles = getHandles(result.data) ?? []
                for (const handle of handles) {
                  // if (handle.uri === 'mal:52741') {
                  //   console.log('updating handle', handle)
                  // }
                  const existingHandle = graph.findOne({ uri: handle.uri })
                  if (existingHandle) {
                    const nonNullFieldsHandle = recursiveRemoveNullable(handle)

                    const existingHandles =
                      existingHandle
                        .handles
                        ?.edges
                        .map(edge => edge.node)
                      ?? existingHandle.handles?.nodes
                      ?? []

                    const _handles =
                      nonNullFieldsHandle
                        .handles
                        ?.edges
                        .map(edge => edge.node)
                      ?? nonNullFieldsHandle.handles?.nodes
                      ?? []

                    const mergedHandlesItems = [
                      ...existingHandles,
                      ...(
                        _handles
                          .filter(handle =>
                            !existingHandles.some(existingHandle =>
                              existingHandle.__graph_type__
                                ? existingHandle.data.uri === handle.uri
                                : existingHandle.uri === handle.uri
                            )
                          )
                      )
                    ]

                    // console.log('mergedHandlesItems', existingHandle, mergedHandlesItems)

                    const handles = {
                      edges: mergedHandlesItems.map(handle => ({
                        node: handle,
                        handleRelationType: HandleRelation.Identical
                      })),
                      nodes: mergedHandlesItems
                    }

                    graph.updateOne(
                      { uri: handle.uri },
                      {
                        $set: {
                          ...nonNullFieldsHandle,
                          handles
                        }
                      }
                    )
                    // if (handle.uri === 'mal:52741') {
                    //   console.log('updated handle', graph.findOne({ uri: handle.uri }, { returnNode: true }))
                    // }
                    continue
                  } else {
                    graph.insertOne(handle)
                  }
                }
              } catch (err) {
                console.error(err)
              }
            }
          })
        )
      )
  )

export const mergeOriginSubscriptionResults = <T extends keyof SubscriptionResolvers>(
  { graph, name, results, mergeHandles }:
  { graph: Graph, name: T, results: ReturnType<typeof subscribeToOrigins>, mergeHandles: <T2 extends Handle[]>(handles: T2) => T2[number] }
) =>
  results
    .pipe(
      map(_results => {
        const resultsData =
          _results
            .map(result => result.data)
            .filter((data) => Boolean(data))
            .filter(data => Boolean(data?.[name as keyof typeof data]))
        if (!resultsData.length) return

        const scannarHandle = makeScannarrHandle2({
          handles:
            resultsData
              .map(data => data![name as keyof typeof data]),
          mergeHandles
        })

        // try {
        //   const existingNode = graph.getNode(getNodeId(scannarHandle))
        //   if (existingNode) {
        //     existingNode.set(scannarHandle)
        //   } else {
        //     graph.makeNode(scannarHandle)
        //   }
        // } catch (err) {
        //   console.error(err)
        // }

        return {
          [name]: scannarHandle
        } as unknown as { [K in T]: SubscriptionResolverHandleValue<K> }
      })
    )
