import type { OriginCtx, ServerContext } from '../urql/server'

import { combineLatest, from } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { gql } from 'graphql-tag'
import { Episode, EpisodePage, Handle, Media, MediaPage, PlaybackSource, PlaybackSourcePage, ResolversTypes, SubscriptionResolvers, UserMediaPage } from '../generated/graphql'
import { groupRelatedHandles, makeScannarrHandle2 } from '../urql'
import { InMemoryGraphDatabase, NodeData, getNodes, getNodesType, recursiveRemoveNullable, replaceNodePairs } from '../urql/graph'
import { merge } from './deep-merge'
import { keyResolvers } from '../urql/client'
import { fromScannarrUri } from './uri'

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
  // T extends NodeData ? T :
  T extends Handle2 ? T :
  T extends Promise<infer U> ? ExtractHandleType<U> :
  T extends Array<infer U> ? ExtractHandleType<U> :
  T extends object ? { [key in keyof T]: ExtractHandleType<T[key]> }[keyof T] :
  never

type NonUndefinable<T> = Exclude<T, undefined | null>

const handleTypeNames =
  Object
    .entries(keyResolvers)
    .filter(([, resolver]) => resolver({ uri: 'foo:bar' }) === 'foo:bar')
    .map(([key]) => key) as HandleTypename[]

export const getNodeId = (handle: Handle2) =>
  `${handle.__typename}:${keyResolvers[handle.__typename!](handle)}`

export const getHandles = <T>(value: T): NonUndefinable<ExtractHandleType<T>>[] => {
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
  return [...handlesMap.values()] as ExtractHandleType<T>[]
}

type ValidSubscriptionKeys = Exclude<keyof SubscriptionResolvers, '_empty'>

// type SubscriptionResolverValue<T extends ValidSubscriptionKeys> =
//   Extract<
//       Awaited<
//         ReturnType<
//           ReturnType<
//             Awaited<
//               ReturnType<
//                 Exclude<
//                   ReturnType<
//                     Extract<
//                       SubscriptionResolvers[T],
//                       Function
//                     >
//                   >,
//                   SubscriptionResolverObject<any, any, any, any>
//                 >['subscribe']
//               >
//             >[typeof Symbol['asyncIterator']]
//           >['next']
//         >
//       >,
//       IteratorYieldResult<any>
//     >['value']



// type SubscriptionResolverInnerValue<T extends ValidSubscriptionKeys> = SubscriptionResolverValue<T>[keyof SubscriptionResolverValue<T>]

// type SubscriptionResolverHandleValue<T extends ValidSubscriptionKeys> = NonUndefinable<Awaited<SubscriptionResolverInnerValue<T>>>

type QueryNameToData<T extends ValidSubscriptionKeys> =
  T extends 'media' ? Media :
  T extends 'mediaPage' ? { mediaPage: MediaPage } :
  T extends 'episode' ? { episode: Episode } :
  T extends 'episodePage' ? { episodePage: EpisodePage } :
  T extends 'playbackSource' ? { playbackSource: PlaybackSource } :
  T extends 'playbackSourcePage' ? { playbackSourcePage: PlaybackSourcePage } :
  T extends 'userMediaPage' ? { userMediaPage: UserMediaPage } :
  never

export const subscribeToOrigins = <T extends ValidSubscriptionKeys>(
  { graph, name, context, origins, mergeHandles }:
  { graph: InMemoryGraphDatabase, name: T, context: ServerContext, origins: OriginCtx[], mergeHandles: <T2 extends Handle[]>(handles: T2) => T2[number] }
) =>
  combineLatest(
    ...origins
      .map(origin =>
        from(
          origin
            .client
              .subscription<QueryNameToData<T>>(
                gql([context.params.query]),
                context.params.variables
              )
        )
        .pipe(
          map(result =>
            (result.error?.message === '[Network] No Content'
              ? { ...result, data: { [name]: null } as { [K in T]: null }, error: undefined, origin }
              : { ...result, origin }) as typeof result & { origin: OriginCtx }
          ),
          tap((result) => {
            if (result.error) {
              console.warn('Error in origin', result.origin.origin.name)
              console.error(result.error)
            } else if (result.data) {
              try {
                const nodes =
                  getNodesType(result.data)
                    .map(childNode => {
                      const existingNode = graph.findOne(node => node.uri === childNode.uri)
                      if (existingNode) {
                        return graph.updateOne(
                          existingNode._id,
                          (node) => ({
                            ...node,
                            ...recursiveRemoveNullable(childNode)
                          }) as NodeData
                          // (node) => mergeHandles([
                          //   node,
                          //   recursiveRemoveNullable(childNode)
                          // ]) as NodeData
                        )
                      }
                      return graph.insertOne(childNode)
                    })
                    
                for(const node of nodes) {
                  graph.updateOne(
                    node._id,
                    node => {
                      const handles =
                        node
                          .handles
                          ?.map(handle => graph.findOne(node => node.uri === handle.uri))
                          ?? []
                      return ({
                        ...node,
                        handles
                      })
                    }
                  )
                }

                const { handleGroups } = groupRelatedHandles({
                  results:
                    graph.find(node =>
                      node.origin !== 'scannarr'
                    )
                })

                const newNodeDataNodes = getNodesType(handleGroups)

                for (const nodeData of newNodeDataNodes) {
                  const foundNode = graph.findOne(node => node.uri === nodeData.uri)
                  if (foundNode) {
                    graph.updateOne(
                      foundNode._id,
                      node => ({
                        ...node,
                        ...recursiveRemoveNullable(nodeData)
                      })
                    )
                  } else {
                    graph.insertOne(nodeData)
                  }
                }

                for (const groupedHandles of handleGroups) {
                  const scannarrNode =
                    graph.findOne((scannarrNode) =>
                      scannarrNode.origin === 'scannarr' &&
                      fromScannarrUri(scannarrNode.uri)
                        ?.handleUris
                        .some(handleUri =>
                          groupedHandles
                            .some(handle => handleUri === handle.uri)
                        )
                    )

                  if (scannarrNode) {
                    graph.updateOne(
                      scannarrNode._id,
                      (node) => {
                        const uniqueHandles =
                          [
                            ...(
                              [...node.handles, ...groupedHandles]
                                .reduce((acc, handle) => {
                                  const key = handle.uri
                                  if (!acc.has(key)) {
                                    acc.set(key, handle)
                                  }
                                  return acc
                                }, new Map<string, Handle2>())
                                .values()
                            )
                          ]
                          .map(handle => {
                            const foundNode =
                              graph.findOne(node => node.uri === handle.uri)
                              ?? graph.insertOne(handle)
                            return foundNode
                          })

                        // if (uniqueHandles.some(data => data === undefined)) {
                        //   console.log('UNDEFINED NODE', uniqueHandles, [...node.handles, ...groupedHandles])
                        // }

                        const mergedResult = makeScannarrHandle2({
                          handles: uniqueHandles,
                          mergeHandles
                        })

                        // if (mergedResult.uri.includes('anilist:153518')) {
                        //   console.log('MAKING SCANNARR HANDLE', mergedResult, uniqueHandles)
                        // }
                      
                        return {
                          ...mergedResult,
                          _id: node._id
                        }
                      }
                    )
                    // console.log('after update node', graph.findNodeOne(scannarrNode._id))

                    // const newNodeDataNodes = getNodesType(newNodeData)

                    // for (const nodeData of newNodeDataNodes) {
                    //   const scannarrNode =
                    //     graph.findOne((scannarrNode) =>
                    //       scannarrNode.origin === 'scannarr' &&
                    //       fromScannarrUri(scannarrNode.uri)
                    //         ?.handleUris
                    //         .some(handleUri => nodeData.uri === handleUri)
                    //     )

                    //   if (scannarrNode) {
                    //     graph.updateOne(
                    //       scannarrNode._id,
                    //       (node) => ({
                    //         ...node,
                    //         ...recursiveRemoveNullable(nodeData)
                    //       })
                    //     )
                    //   } else {
                    //     console.log('inserting node node', nodeData)
                    //     graph.insertOne(
                    //       makeScannarrHandle2({
                    //         handles: [nodeData],
                    //         mergeHandles
                    //       })
                    //     )
                    //   }
                    // }

                    // console.log('after update node nodes', newNodeDataNodes)
                  } else {
                    graph.insertOne(
                      makeScannarrHandle2({
                        handles: groupedHandles,
                        mergeHandles
                      })
                    )
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

export const mergeOriginSubscriptionResults = <T extends ValidSubscriptionKeys>(
  { graph, name, results, mergeHandles }:
  { graph: InMemoryGraphDatabase, name: T, results: ReturnType<typeof subscribeToOrigins>, mergeHandles: <T2 extends Handle[]>(handles: T2) => T2[number] }
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

        return {
          [name]: scannarHandle
        } as unknown as { [K in T]: QueryNameToData<T> }
      })
    )
