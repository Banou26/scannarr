import type { Cache, ResolveInfo } from '@urql/exchange-graphcache'

import type { ServerResolverParameters } from './server'
import { HandleRelation, type MediaPage, type Resolvers } from '../generated/graphql'

import { map } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { groupBy, isScannarrUri } from '../utils'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  Media: {
    // @ts-expect-error
    episodes: (parent, args, ctx, info) => {
      if (!isScannarrUri(parent.uri)) return parent.episodes

      const originHandles =
        (parent.episodes?.edges.map(edge => edge.node)
          ?? parent.episodes?.nodes
          ?? [])
        .flatMap(episode =>
          episode?.handles?.edges.map(edge => edge.node)
            ?? episode?.handles?.nodes
            ?? []
        )
          
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

      return {
        edges: scannarrEpisodes.map(episode => ({
          handleRelationType: HandleRelation.Identical,
          node: episode
        })),
        nodes: scannarrEpisodes
      }
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
                name: 'media'
              }),
            mergeHandles,
            name: 'media'
          })
        ),
      resolve: (parent) => parent?.media
    },
    mediaPage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'mediaPage'
          }).pipe(
            map(results => {
              const { handleGroups } = groupRelatedHandles({
                results:
                  results
                    .map(result => result.data?.mediaPage as MediaPage)
                    .flatMap(mediaPage => mediaPage?.nodes ?? [])
              })
              const scannarrHandles =
                handleGroups
                  .map(handles =>
                    makeScannarrHandle2({
                      handles,
                      mergeHandles
                    })
                  )

              for (const handle of scannarrHandles) {
                const existingNode = graph.getNode(handle.id)
                if (existingNode) {
                  existingNode.set(handle)
                } else {
                  graph.makeNode(handle)
                }
              }

              return {
                mediaPage: {
                  edges: scannarrHandles.map(media => ({ node: media })),
                  nodes: scannarrHandles
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
