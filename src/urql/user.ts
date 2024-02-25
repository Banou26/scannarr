import { getOriginResult, getOriginResults } from './utils'
import { ServerContext } from './client'

export const serverResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
  Query: {
    originAuthentication: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      for (const result of results) {
        if (!result.error) continue
        console.error(result.error)
      }

      return (
        results
          .filter(result => result.data?.originAuthentication?.[0])
          .flatMap((result, i) => ({
            ...result.data?.originAuthentication?.[0],
            origin: {
              id: origins[i].origin.origin,
              ...origins[i].origin
            }
          }))
      )
    }
  },
  Mutation: {
    originAuthenticate: async (parent, { input }, ctx, info) => {
      const origin = origins.find(origin => origin.origin.origin === input.origin)
      const result = await getOriginResult({ ctx, origin, context })
      console.log('result', result)
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
      return result?.data?.originAuthenticate
    }
  }
})
