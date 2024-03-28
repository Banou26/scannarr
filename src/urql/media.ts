import type { Cache, ResolveInfo } from '@urql/exchange-graphcache'

import type { ServerResolverParameters } from './server'
import { Media, type MediaPage, type Resolvers } from '../generated/graphql'

import { map, switchMap, tap } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { fromScannarrUri, groupBy, isScannarrUri } from '../utils'
import { combineLatest, lastValueFrom, of } from 'rxjs'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  Media: {
    // @ts-expect-error
    episodes: (parent, args, ctx, info) => {
      if (!isScannarrUri(parent.uri)) return parent.episodes

      const originHandles =
        parent
          .episodes
          .flatMap(episode => episode.handles ?? [])

      const groupedEpisodes = [
        ...groupBy(
          originHandles,
          episode => episode.number
        )
      ]

      const scannarrEpisodes =
        groupedEpisodes
          .filter(([episodeNumber]) => episodeNumber !== null && episodeNumber !== undefined)
          .map(([, handles]) =>
            makeScannarrHandle2({
              handles,
              mergeHandles
            })
          )

      return scannarrEpisodes
    }
  },
  Subscription: {
    media: {
      subscribe: (_, __, context) =>
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
          })
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
            switchMap(results => {
              try {
                const handles =
                  results
                    .map(result => result.data?.mediaPage as MediaPage)
                    .flatMap(mediaPage => mediaPage?.nodes ?? [])

                const handleNodes =
                  handles
                    .map(mediaHandle =>
                      graph.findOne((node) => node.uri === mediaHandle.uri)
                    )

                // console.log('handles', handles)
                // console.log('handleNodes', handleNodes)

                // const { handleGroups } = groupRelatedHandles({ results: handles })
                const { handleGroups } = groupRelatedHandles({ results: handleNodes })
                const scannarrHandles =
                  handleGroups
                    .map(handles =>
                      makeScannarrHandle2({
                        handles,
                        mergeHandles
                      })
                    ) as Media[]

                const scannarrNodes = scannarrHandles.map(handle => {
                  const node = graph.findOne((node) =>
                    node.origin === 'scannarr' &&
                    fromScannarrUri(handle.uri)
                      ?.handleUris
                      .some(handleUri => node.uri.includes(handleUri))
                  )

                  if (node) {
                    return graph.updateOne(node._id, (node) => mergeHandles(node, handle))
                  } else {
                    return graph.insertOne(handle)
                  }
                })

                console.log('scannarrHandles', scannarrHandles)
                // console.log('scannarrNodes', scannarrNodes)

                console.log('obs', scannarrNodes.map(node => graph.findOne(node!._id)))
                // console.log('obs', scannarrNodes.map(node => lastValueFrom(graph.mapOne(node!._id, (data) => data))))

                combineLatest(scannarrNodes.map(node => graph.mapOne(node!._id, (data) => data)))
                    .pipe(
                      map(results => ({
                        mediaPage: {
                          nodes: results
                        }
                      })),
                      tap(val => console.log('val', val))
                    )
                    .subscribe(val => console.log('sub', val))

                return (
                  combineLatest(scannarrNodes.map(node => graph.mapOne(node!._id, (data) => data)))
                    .pipe(
                      map(results => ({
                        mediaPage: {
                          nodes: results
                        }
                      })),
                      tap(val => console.log('val', val))
                    )
                )
              } catch (err) {
                console.error(err)
                return of({
                  mediaPage: {
                    nodes: []
                  }
                })
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
