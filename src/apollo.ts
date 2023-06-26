import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import makeApolloAggregator, { Context, OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers } from './utils/apollo'

const typeDefs = `#graphql

`

export default ({ context, origins }: { context: ContextThunk<Context>, origins: OriginWithResolvers[] }) => {
  const cache = new InMemoryCache({
    typePolicies: {
      Media: {
        fields: {

        }
      }
    }
  })

  const { client, server, link } = makeApolloAggregator({
    cache,
    typeDefs,
    origins: origins.map(origin => ({
      ...origin,
      resolvers: defaultResolvers(origin.resolvers)
    })),
    context: async () => ({ ...await context?.(), server, client }),
    resolvers: defaultResolvers({
      Page: {
        media: (...args) => {
          const [, , { originResults }] = args

          
        }
      }
    })
  })

  return {
    cache,
    client,
    server,
    link
  }
}
