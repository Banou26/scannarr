import type { ServerResolverParameters } from './server'

import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'

import { Media, MediaPage, Resolvers } from '../generated/graphql'
import { makeScannarrHandle2 } from './utils'
import { populateEpisode } from './episode'
import { groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { map } from 'rxjs/operators'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'

export const populateMedia = (media: Media, resolve?: (ref: any, str: string) => any) => ({
  __typename: 'Media',
  origin: (resolve ? resolve(media, 'origin') : media.origin) ?? media.origin,
  id: (resolve ? resolve(media, 'id') : media.id) ?? media.id,
  uri: (resolve ? resolve(media, 'uri') : media.uri) ?? media.uri,
  url: resolve ? resolve(media, 'url') : media.url ?? '',
  handles: {
    __typename: 'MediaConnection',
    edges:
      typeof media.handles?.edges === 'function'
        ? (
          async function *() {
            // @ts-ignore
            for await (const edge of media.handles?.edges()) {
              yield {
                ...edge,
                node: populateMedia(edge.node),
                __typename: 'MediaEdge'
              }
            }
          }
        )
        : (
          media.handles?.edges.map(edge => ({
            ...edge,
            node: populateMedia(edge.node),
            __typename: 'MediaEdge'
          })) ?? []
        )
  },
  title:  media.title ?? {
    romanized: null,
    english: null,
    native: null,
  },
  startDate: media.startDate ?? {
    day: null,
    month: null,
    year: null,
  },
  endDate: media.endDate ?? {
    day: null,
    month: null,
    year: null,
  },

  episodes: {
    __typename: 'EpisodeConnection',
    edges:
      media.episodes?.edges.map(edge => ({
        ...edge,
        node: populateEpisode(edge.node),
        __typename: 'EpisodeEdge'
      }))
      ?? []
  },
  coverImage: media.coverImage ?? [],
  trailers: media.trailers ?? [],
  externalLinks: media.externalLinks ?? [],
  bannerImage: media.bannerImage ?? [],

  description: resolve ? resolve(media, 'description') : media.description ?? null,
  shortDescription: resolve ? resolve(media, 'shortDescription') : media.shortDescription ?? null,
  popularity: resolve ? resolve(media, 'popularity') : media.popularity ?? null,
  averageScore: resolve ? resolve(media, 'averageScore') : media.averageScore ?? null,
  episodeCount: resolve ? resolve(media, 'episodeCount') : media.episodeCount ?? null
})

export const serverResolvers = ({ origins, mergeHandles }: ServerResolverParameters) => ({
  Subscription: {
    media: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            results:
              subscribeToOrigins({
                origins,
                context,
                name: 'media'
              }),
            mergeHandles,
            name: 'media'
          })
        )
    },
    mediaPage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            origins,
            context,
            name: 'mediaPage'
          }).pipe(
            map(results => {
              const nodes =
                results
                  .map(result => result.data?.mediaPage as MediaPage)
                  .flatMap(mediaPage => mediaPage?.nodes ?? [])
              const { handleGroups } = groupRelatedHandles({ results: nodes })
              const scannarrHandles = handleGroups.map(handles => makeScannarrHandle2({ handles, mergeHandles }))
              console.log('scannarrHandles', scannarrHandles)
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
    default: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
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
