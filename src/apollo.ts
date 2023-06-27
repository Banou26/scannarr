import type { TypeSource } from '@graphql-tools/utils'

import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import makeApolloAggregator, { Context, OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers, groupRelatedHandles } from './utils/apollo'
import { Media, PageResolvers } from './generated/graphql'

import schema from './graphql'

// const typeDefs = `#graphql

// `

export default <T extends ContextThunk>({ context, origins }: { typeDefs: TypeSource, context: T, origins: OriginWithResolvers[] }) => {
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
    typeDefs: schema,
    origins: origins.map(origin => ({
      ...origin,
      resolvers: defaultResolvers(origin.resolvers)
    })),
    context: async () => ({ ...await context?.(), server, client }),
    resolvers: defaultResolvers({
      Page: {
        media: (...args) => {
          const [, , { originResults }] = args
          const originResultsHandles = (originResults?.flatMap(results => results.data.Page.media ?? []) ?? []) as Media[]

          const results = groupRelatedHandles({ results: originResultsHandles, typename: 'media' })
          console.log('RESULTS', results)

          return results.scannarrHandles
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
