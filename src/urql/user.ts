import { getOriginResult, getOriginResults, groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { populateMedia } from './media'
import { Media } from '../generated/graphql'

export const serverResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
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
              `Laserr Error from "${origin.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.user
    },

    userMediaPage: async (parent, { input }, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      for (const i in results) {
        const result = results[i]
        if (!result.errors) continue
        const origin = origins[i]
        console.error(
          result
            .errors
            .map(error =>
              `Laserr Error from "${origin.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'Media',
        results: (results?.flatMap(results => results.data.userMediaPage?.nodes ?? []) ?? []) as Media[]
      })
      return {
        nodes: scannarrHandles.map(media => populateMedia(media))
      }
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
              `Laserr Error from "${origin.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.authenticate
    }
  }
})
