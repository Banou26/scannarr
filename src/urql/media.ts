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
  Media: {
    handles: (parent, args, ctx, info) => parent.handles ?? [],
    episodes: (parent, args, ctx, info) => parent.episodes ?? []
  },
  Episode: {
    handles: (parent, args, ctx, info) => parent.handles ?? []
  },
  Subscription: {
    media: {
      subscribe: (_, __, context, info) =>
        console.log('NEW REQ media', info) ||
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
            map((result) => ({ media: result })),
            // map((result) => console.log('result2', result) || ({ media: result })),
            catchError(err => {
              console.error(err)
              return { media: null }
            })
          )
        ),
      resolve: (parent) => parent?.media
    },
    // I need to go thru every new Media, update the graph db consequently, remove duplicate scannarr handles,
    // to de-dupe them, i can go thru the media itself, and update their reference to the scannarr handle to the new one while merging it
    // then map on all of the medias, get their related scannarr handles, de-dupe them, and return them
    mediaPage: {
      subscribe: (_, __, context, info) =>
        console.log('NEW REQ mediaPage', info) ||
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
                console.log('handleNodes', handleNodes)
                return ({
                  mediaPage: {
                    nodes: handleNodes
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
                            (data.uri === 'mal:52701' && (
                              console.log('info', info) ||
                              console.log('buildNodeSelectionMap(info)', buildNodeSelectionMap(info), data)
                            )) || (
                              !data.handles.find(handle => handle.origin === 'scannarr') && (
                                console.log(
                                  'result',
                                  data,
                                  data.handles.find(handle => handle.origin === 'scannarr'),
                                  mapNodeToNodeSelection(
                                    graph,
                                    buildNodeSelectionMap(info),
                                    data.handles.find(handle => handle.origin === 'scannarr')
                                  )
                                )
                              )
                            )
                          ) ||
                          (!Object.keys(mapNodeToNodeSelection(
                            graph,
                            buildNodeSelectionMap(info),
                            data.handles.find(handle => handle.origin === 'scannarr')
                          )).length ? console.log('AAAAAAAAAAAA', data) : undefined) ||
                          mapNodeToNodeSelection(
                            graph,
                            buildNodeSelectionMap(info),
                            data.handles.find(handle => handle.origin === 'scannarr')
                          )
                      )
                    )
                  })
              )
            ),
            throttleTime(100, undefined, { leading: true, trailing: true }),
            map((results) => console.log('results', results.filter(node => node.handles?.some(_node => !_node.episodes) ?? true)) || ({
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
