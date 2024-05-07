import type { Cache, ResolveInfo } from '@urql/exchange-graphcache'

import type { ServerResolverParameters } from './server'
import { Media, type MediaPage, type Resolvers } from '../generated/graphql'

import { catchError, map, switchMap, tap, throttleTime } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles, mapNodeToSelection, isFieldNode, buildSelectionMap, buildNodeSelectionMap, mapNodeToNodeSelection } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { fromScannarrUri, groupBy, isScannarrUri, toScannarrUri } from '../utils'
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
                  (data) =>
                    mapNodeToNodeSelection(
                      graph,
                      buildNodeSelectionMap(info),
                      data
                    )
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
        // console.log('NEW REQ mediaPage', info) ||
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
                // console.log('handleNodes', handleNodes)
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
                          mapNodeToNodeSelection(
                            graph,
                            buildNodeSelectionMap(info),
                            data.handles.find(handle => handle.origin === 'scannarr')
                          )
                      ).pipe(
                        tap(res => {
                          if (res.origin) return
                          // console.log('AAAAAAAAAAAAAAAAAAAAAAAAA', res, node)
                        })
                      )
                    )
                  })
              )
            ),
            throttleTime(25, undefined, { leading: true, trailing: true }),
            map((results) => {
              const groupById =
                groupBy(
                  results,
                  result => result._id
                )

              const resultNodes =
                [...groupById
                  .values()]
                  .map(group => group[0])

              return {
                mediaPage: {
                  nodes: resultNodes
                }
              }
            }),
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
              _id: info.parentKey.slice('Media:'.length, info.parentKey.indexOf('.coverImage'))
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
