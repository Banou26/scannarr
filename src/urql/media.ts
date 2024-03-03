import type { ServerResolverParameters } from './server'
import type { MediaPage, Resolvers } from '../generated/graphql'

import { Cache, ResolveInfo } from '@urql/exchange-graphcache'
import { map } from 'rxjs/operators'

import { makeScannarrHandle2 } from './utils'
import { groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'

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
