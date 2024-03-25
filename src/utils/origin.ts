import type { OriginCtx, ServerContext } from '../urql/server'

import { combineLatest, from } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { gql } from 'graphql-tag'
import { Episode, EpisodePage, Handle, Media, MediaPage, PlaybackSource, PlaybackSourcePage, ResolversTypes, SubscriptionResolvers, UserMediaPage } from '../generated/graphql'
import { groupRelatedHandles, makeScannarrHandle2 } from '../urql'
import { InMemoryGraphDatabase, NodeData, getNodes, recursiveRemoveNullable, replaceNodePairs } from '../urql/graph'
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
  T extends 'media' ? { media: Media } :
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
                const handles = getHandles(result.data)
                for (const handle of handles) {
                  const handleNode = graph.findOne(node => node.uri === handle.uri) ?? graph.insertOne(handle)

                  const nonNullFieldsHandle = recursiveRemoveNullable(handle)
                  const mergedHandlesItems = [
                    ...handleNode.handles ?? [],
                    ...(
                      (nonNullFieldsHandle.handles ?? [])
                        .filter(handle =>
                          !handleNode
                            .handles
                            ?.some(existingHandle => existingHandle.uri === handle.uri)
                        )
                    )
                  ].map(handle => {
                    const childNodes = getNodes(handle)
                    const replacementNodes = childNodes.map(childNode => {
                      const existingNode = graph.findOne(node => node.uri === childNode.uri)
                      if (existingNode) {
                        return graph.updateOne(
                          existingNode._id,
                          (node) => ({
                            ...node,
                            ...recursiveRemoveNullable(childNode)
                          } as NodeData)
                        )
                      }
                      return graph.insertOne(childNode)
                    })
                    
                    const newHandle = replaceNodePairs(
                      handle,
                      handle
                        .handles
                        ?.map((handle, i) => [handle, replacementNodes[i]])
                      ?? []
                    )
                    const node = graph.findOne(node => node.uri === newHandle?.uri)
                    if (!node) return graph.insertOne(newHandle)
                    return graph.updateOne(node._id, (node) => ({ ...node, ...recursiveRemoveNullable(newHandle) } as NodeData))
                  })

                  graph.updateOne(
                    handleNode._id,
                    node => ({
                      ...node,
                      ...nonNullFieldsHandle,
                      handles: mergedHandlesItems
                    } as NodeData)
                  )
                  continue
                }

                // const typename = handles[0]?.__typename

                // if (typename) {
                //   const similarTypeAllHandles = graph.find(node => node.__typename === typename && node.origin !== 'scannarr')

                //   const { handleGroups } = groupRelatedHandles({ results: similarTypeAllHandles })
  
                //   const scannarrHandles =
                //     handleGroups
                //       .map(handles =>
                //         makeScannarrHandle2({
                //           handles,
                //           mergeHandles
                //         })
                //       )

                //   for (const scannarrHandle of scannarrHandles) {
                //     const handleUris = scannarrHandle.handles.map(handle => handle.uri)
                //     const existingScannarrHandle =
                //       graph
                //         .findOne(node =>
                //           node.origin === 'scannarr' &&
                //           node.handles.some(handle => handleUris.includes(handle.uri))
                //         )
                //     if (existingScannarrHandle) {
                //       const nonNullFieldsHandle = recursiveRemoveNullable(scannarrHandle)

                //       const mergedHandlesItems = [
                //         ...existingScannarrHandle.handles ?? [],
                //         ...(
                //           (nonNullFieldsHandle.handles ?? [])
                //             .filter(handle =>
                //               !existingScannarrHandle
                //                 .handles
                //                 .some(existingHandle => existingHandle.uri === handle.uri)
                //             )
                //         )
                //       ].filter(node => node.origin !== 'scannarr')

                //       const updatedExistingScannarrHandle = ({
                //         ...existingScannarrHandle,
                //         ...nonNullFieldsHandle,
                //         handles: mergedHandlesItems
                //       })

                //       graph.updateOne(
                //         node => node.uri === existingScannarrHandle.uri,
                //         node => ({
                //           ...node,
                //           ...nonNullFieldsHandle,
                //           handles: mergedHandlesItems
                //         } as NodeData)
                //       )

                //       for (const nonScannarrHandle of mergedHandlesItems) {
                //         graph.updateOne(
                //           node => node.uri === nonScannarrHandle.uri,
                //           node => ({
                //             ...node,
                //             handles: [
                //               ...(node.handles ?? []).filter(handle => handle.origin !== 'scannarr'),
                //               updatedExistingScannarrHandle
                //             ]
                //           } as NodeData)
                //         )
                //       }
                //       continue
                //     } else {
                //       graph.insertOne(scannarrHandle)
                //     }
                //   }
                // }

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
