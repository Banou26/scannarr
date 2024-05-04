import type { OriginCtx, ServerContext } from '../urql/server'

import { combineLatest, from } from 'rxjs'
import { map, tap, throttleTime } from 'rxjs/operators'
import { gql } from 'graphql-tag'
import { Episode, EpisodePage, Handle, Media, MediaPage, PlaybackSource, PlaybackSourcePage, ResolversTypes, SubscriptionResolvers, UserMediaPage } from '../generated/graphql'
import { groupRelatedHandles, isNodeTypename, makeScannarrHandle2 } from '../urql'
import { GraphDatabase } from '../graph-database'
import { ExtractNode, NodeData, getNodes, getNodesType, recursiveRemoveNullable, replaceNodePairs } from '../urql/_graph'
import { merge } from './deep-merge'
import { keyResolvers } from '../urql/client'
import { fromScannarrUri, toScannarrUri } from './uri'

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

// export const getNodesType2 = <T>(value: T): ExtractNode<T>[] => {
//   const objects = new Set()
//   const nodes: ExtractNode<T>[] = []

//   const recurse = (value: any) => {
//     if (!value || typeof value !== 'object') return
//     if (objects.has(value)) return
//     if (isNodeTypename(value)) {
//       nodes.push(value as ExtractNode<T>)
//       objects.add(value)
//       Object.values(value).map(recurse)
//       return
//     }
//     if (Array.isArray(value)) return value.map(recurse)
//     if (value && typeof value === 'object') {
//       if (objects.has(value)) return
//       objects.add(value)
//       Object.values(value).map(recurse)
//     }
//   }

//   recurse(value)
//   return nodes as ExtractNode<T>[]
// }

export const subscribeToOrigins = <T extends ValidSubscriptionKeys>(
  { graph, name, context, origins, mergeHandles }:
  { graph: GraphDatabase, name: T, context: ServerContext, origins: OriginCtx[], mergeHandles: <T2 extends Handle[]>(handles: T2) => T2[number] }
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
                // needed in case there's multiple same nodes thru child handles
                const updateNodes = [
                  ...new Set(
                    getNodesType(result.data)
                      .filter((node): node is NonNullable<typeof node> => Boolean(node))
                      .map(childNode => {
                        const existingNode = graph.findOne({ uri: childNode.uri })
                        if (existingNode) {
                          return graph.updateOne(
                            { _id: existingNode._id },
                            recursiveRemoveNullable(childNode)
                          )!
                        }
                        return graph.insertOne(childNode)
                      })
                  )
                ].filter(Boolean)
                const newNodeDataNodes = getNodesType(updateNodes).filter(node => node._id)
                const { handleGroups: updatedNodesGroups } = groupRelatedHandles({ results: newNodeDataNodes })

                for (const updatedNodes of updatedNodesGroups as NodeData[][]) {
                  const nodeUris = updatedNodes.map(node => node.uri)
                  const foundScannarrNodes = [
                    ...new Set([
                      ...(
                        updatedNodes
                          .flatMap(node =>
                            node.handles?.filter(handle => handle.origin === 'scannarr')
                            ?? []
                          )
                      ),
                      ...graph.find({ origin: 'scannarr', 'handles.uri': nodeUris })
                    ])
                  ]

                  // update relevant scannarr node & potentially deduplicate them
                  if (foundScannarrNodes.length) {
                    const keptScannarrHandle = foundScannarrNodes[0]
                    for (const otherScannarrHandle of foundScannarrNodes.slice(1)) {
                      graph.removeOne({ _id: otherScannarrHandle._id })
                    }

                    const newScannarrUri = toScannarrUri([
                      ...new Set(
                        [
                          ...fromScannarrUri(keptScannarrHandle.uri)?.handleUris ?? [],
                          ...updatedNodes.map(node => node.uri)
                        ].filter(uri => !uri.includes('scannarr'))
                      )
                    ])

                    if (keptScannarrHandle.__typename === 'Media') {
                      const episodeNodes =
                        (updatedNodes as Media[])
                          .flatMap((media) => media.episodes ?? [])
                
                      // const { handleGroups: episodeHandleGroups } = groupRelatedHandles({ results: episodeNodes })
                
                      const groupEpisodesByEpisodeNumber = (episodes: Media[]) => {
                        const episodesByEpisodeNumber = new Map<number, Media[]>()
                        for (const episode of episodes) {
                          if (!episodesByEpisodeNumber.has(episode.number)) {
                            episodesByEpisodeNumber.set(episode.number, [])
                          }
                          episodesByEpisodeNumber.get(episode.number)?.push(episode)
                        }
                        return [...episodesByEpisodeNumber.values()]
                      }
                
                      const episodesByEpisodeNumber = groupEpisodesByEpisodeNumber(episodeNodes)
                
                      const scannarrEpisodeHandles =
                        episodesByEpisodeNumber
                            .map(handles =>
                              makeScannarrHandle2({
                                handles,
                                mergeHandles
                              })
                            )

                      graph.updateOne(
                        { _id: keptScannarrHandle._id },
                        {
                          uri: newScannarrUri,
                          handles: updatedNodes,
                          episodes: scannarrEpisodeHandles
                        }
                      )
                    } else {
                      graph.updateOne({ _id: keptScannarrHandle._id }, { uri: newScannarrUri, handles: updatedNodes })
                    }


                    // console.log('MERGEDHANDLES', mergeHandles([
                    //   keptScannarrHandle,
                    //   ...updatedNodes
                    // ]))
                    // graph.updateOne(
                    //   { _id: keptScannarrHandle._id },
                    //   {
                    //     origin: 'scannarr',
                    //     uri: newScannarrUri,
                    //     ...mergeHandles([
                    //       keptScannarrHandle,
                    //       ...updatedNodes
                    //     ])
                    //   }
                    // )

                    
                    for (const node of updatedNodes) {
                      graph.updateOne({ _id: node._id }, { handles: [keptScannarrHandle] })
                    }
                  } else {
                    const result = graph.insertOne(
                      makeScannarrHandle2({
                        handles: updatedNodes,
                        mergeHandles
                      })
                    )
                    for (const node of updatedNodes) {
                      graph.updateOne({ _id: node._id }, { handles: [result] })
                    }
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
  .pipe(
    throttleTime(100, undefined, { leading: true, trailing: true }),
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
