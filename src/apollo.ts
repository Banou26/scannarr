import type { TypeSource } from '@graphql-tools/utils'

import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import makeApolloAggregator, { OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers, groupRelatedHandles, makeTypePolicies } from './utils/apollo'
import { Media } from './generated/graphql'

import schema from './graphql'

export type Policies = {
  [key: string]: {
    [key: string]: {
      originPriority?: string[],
      merge?: (existing: any, incoming: any) => any
    }
  }
}

const makeScannarr = <T extends ContextThunk>({
  context,
  origins,
  policies
}: {
  typeDefs: TypeSource
  context: T, origins: OriginWithResolvers[]
  policies: Policies
}) => {
  const cache = new InMemoryCache({
    typePolicies: {
      Page: {
        keyFields: [],
        fields: {
          media: {
            merge: (existing, incoming) => incoming
          }
        }
      },
      Media: {
        keyFields: ['uri'],
        fields: {
          ...makeTypePolicies({
            rootTypename: 'Media',
            policies,
            fields: [
              'description',
              'shortDescription',
              'popularity',
              'averageScore'
            ]
          })
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
        media: (_, __, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'media',
            results: (originResults?.flatMap(results => results.data.Page.media ?? []) ?? []) as Media[]
          })
          console.log('scannarrHandles', scannarrHandles)
          return scannarrHandles
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

export default makeScannarr
