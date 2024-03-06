import { getOriginResult, getOriginResults, groupRelatedHandles, makeScannarrHandle2 } from './utils'
import { ServerContext } from './client'
import { UserMediaPage } from '../generated/graphql'
import { observableToAsyncIterable, subscribeToOrigins } from '../utils'
import { map } from 'rxjs'
import { ServerResolverParameters } from './server'

export const serverResolvers = ({ origins, context, mergeHandles }: ServerResolverParameters & { origins: any[], context?: () => Promise<ServerContext> }) => ({
  Query: {
    authentication: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      for (const result of results) {
        if (!result.error) continue
        console.error(result.error)
      }

      return (
        results
          .filter(result => result.data?.authentication?.[0])
          .flatMap((result, i) => ({
            ...result.data?.authentication?.[0],
            origin: {
              id: origins[i].origin.origin,
              ...origins[i].origin
            }
          }))
      )
    },
    user: async (parent, { input }, ctx, info) => {
      const origin = origins.find(origin => origin.origin.origin === input.origin)
      const result = await getOriginResult({ ctx, origin, context })
      if (result.errors) {
        throw new Error(
          result
            .errors
            .map(error =>
              `Laserr Error from "${origin?.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.user
    }
  },
  Subscription: {
    userMediaPage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            origins,
            context,
            name: 'userMediaPage'
          }).pipe(
            map(results => {
              const { handleGroups } = groupRelatedHandles({
                results:
                  results
                    .map(result => result.data?.userMediaPage as UserMediaPage)
                    .flatMap(userMediaPage => userMediaPage?.nodes ?? [])
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
                userMediaPage: {
                  edges: scannarrHandles.map(media => ({ node: media })),
                  nodes: scannarrHandles
                }
              }
            })
          )
        )
    }
  },
  Mutation: {
    authenticate: async (parent, { input }, ctx, info) => {
      const origin = origins.find(origin => origin.origin.origin === input.origin)
      const result = await getOriginResult({ ctx, origin, context })
      if (result.errors) {
        throw new Error(
          result
            .errors
            .map(error =>
              `Laserr Error from "${origin?.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.authenticate
    }
  }
})
