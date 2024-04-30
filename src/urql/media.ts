import type { Cache, ResolveInfo } from '@urql/exchange-graphcache'

import type { ServerResolverParameters } from './server'
import { Media, type MediaPage, type Resolvers } from '../generated/graphql'

import { catchError, map, switchMap, tap, throttleTime } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles, mapNodeToSelection, isFieldNode, buildSelectionMap, buildNodeSelectionMap, mapNodeToNodeSelection } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { fromScannarrUri, groupBy, isScannarrUri } from '../utils'
import { combineLatest, lastValueFrom, of } from 'rxjs'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  // Media: {
  //   // @ts-expect-error
  //   episodes: (parent, args, ctx, info) => {
  //     if (!isScannarrUri(parent.uri)) return parent.episodes ?? []

  //     const originHandles =
  //       parent
  //         .episodes
  //         .flatMap(episode => episode.handles ?? [])

  //     const groupedEpisodes = [
  //       ...groupBy(
  //         originHandles,
  //         episode => episode.number
  //       )
  //     ]

  //     const scannarrEpisodes =
  //       groupedEpisodes
  //         .filter(([episodeNumber]) => episodeNumber !== null && episodeNumber !== undefined)
  //         .map(([, handles]) =>
  //           makeScannarrHandle2({
  //             handles,
  //             mergeHandles
  //           })
  //         )

  //     return scannarrEpisodes ?? []
  //   }
  // },
  Episode: {
    handles: (parent, args, ctx, info) => parent.handles ?? []
  },
  Subscription: {
    media: {
      subscribe: (_, __, context, info) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            graph,
            results:
              subscribeToOrigins({
                graph,
                origins,
                context,
                name: 'media',
                mergeHandles
              }),
            mergeHandles,
            name: 'media'
          }).pipe(
            switchMap((result) => {
              console.log('result', result)
              const media = result?.media

              const rootSelectionSet =
                info
                  .fieldNodes
                  .find(node => node.name.value === 'media')
                  ?.selectionSet

              if (!rootSelectionSet) throw new Error('No rootSelectionSet')

              const handleUris = fromScannarrUri(media.uri)?.handleUris
              if (!handleUris) return of(null)

              return (
                graph.mapOne(
                  {
                    origin: 'scannarr',
                    'handles.uri': handleUris
                  },
                  (data) => mapNodeToSelection(graph, info, data, rootSelectionSet)
                )
              )
            }),
            throttleTime(100, undefined, { leading: true, trailing: true }),
            map((result) => console.log('result2', result) || ({ media: result })),
            catchError(err => {
              console.error(err)
              return { media: null }
            })
          )
        ),
      resolve: (parent) => parent?.media
    },
    mediaPage: {
      subscribe: (_, __, context, info) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'mediaPage',
            mergeHandles
          }).pipe(
            map(results => {
              try {
                const handles =
                  results
                    .map(result => result.data?.mediaPage as MediaPage)
                    .flatMap(mediaPage => mediaPage?.nodes ?? [])

                const handleNodes =
                  handles
                    .map(mediaHandle =>
                      graph.findOne({ uri: mediaHandle.uri })
                    )

                const { handleGroups } = groupRelatedHandles({ results: handleNodes })
                const scannarrHandles =
                  handleGroups
                    .map(handles =>
                      makeScannarrHandle2({
                        handles,
                        mergeHandles
                      })
                    ) as Media[]

                const scannarrNodes =
                  scannarrHandles
                    .map(handle =>
                      graph.findOne({
                        origin: 'scannarr',
                        'handles.uri': fromScannarrUri(handle.uri)?.handleUris
                      })
                    )

                console.log('scannarrHandles', scannarrHandles)
                console.log('scannarrNodes', scannarrNodes)
                return ({
                  mediaPage: {
                    nodes: scannarrNodes
                  }
                })
              } catch (err) {
                console.error(err)
                return ({
                  mediaPage: {
                    nodes: []
                  }
                })
              }
            }),
            switchMap(({ mediaPage }) =>
              combineLatest(
                mediaPage
                  .nodes
                  .map(node => {
                    const rootSelectionSet =
                      info
                        .fieldNodes
                        .find(node => node.name.value === 'mediaPage')
                        ?.selectionSet
                        ?.selections
                        .filter(isFieldNode)
                        ?.find(node => node.name.value === 'nodes')
                        ?.selectionSet

                    if (!rootSelectionSet) throw new Error('No rootSelectionSet')
                      
                    

                    return (
                      graph.mapOne(
                        { _id: node._id },
                        (data) =>
                          (
                            // https://myanimelist.net/anime/52701 https://anilist.co/anime/153518
                            data.uri === 'scannarr:(mal:52701)' && (
                              console.log('info', info) ||
                              console.log('buildNodeSelectionMap(info)', buildNodeSelectionMap(info))
                            )
                          ) ||
                          // mapNodeToSelection(graph, info, data, rootSelectionSet)
                          mapNodeToNodeSelection(graph, buildNodeSelectionMap(info), data)
                      )
                    )
                  })
              )
            ),
            throttleTime(100, undefined, { leading: true, trailing: true }),
            map((results) => console.log('results', results.filter(val => !val.episodes)) || ({
              mediaPage: {
                nodes: results.filter(Boolean)
              }
            })),
            catchError(err => {
              console.error(err)
              return {
                mediaPage: {
                  nodes: []
                }
              }
            })
          )
        )
    }
  }
} satisfies Resolvers)

export const cacheResolvers = ({ context }: { context?: () => Promise<ServerContext> }) => ({
  MediaCoverImage: {
    default: (_, __, cache: Cache, info: ResolveInfo) => {
      const coverImageRefs =
        cache
          .resolve(
            {
              __typename: 'Media',
              uri: info.parentKey.slice('Media:'.length, info.parentKey.indexOf('.coverImage'))
            },
            `coverImage`
          )

      const coverImageRef = (coverImageRefs as string[])?.at(Number(info.parentKey.split('.').at(-1)))
      
      if (!coverImageRef) return null

      return (
        cache.resolve(coverImageRef, 'extraLarge')
        ?? cache.resolve(coverImageRef, 'large')
        ?? cache.resolve(coverImageRef, 'medium')
        ?? cache.resolve(coverImageRef, 'small')
      )
    }
  }
})
