import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import makeApolloAggregator, { OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers, groupRelatedHandles, makeObjectTypePolicy, makePrimitiveTypePolicy } from './utils/apollo'
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
          ...Object.fromEntries([
            'description',
            'shortDescription',
            'popularity',
            'averageScore'
          ].map(fieldName => [
            fieldName,
            makePrimitiveTypePolicy({ fieldName, policy: policies.Media?.[fieldName] })
          ])),
          title: makeObjectTypePolicy({
            fieldName: 'title',
            policy: policies.Media?.title
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
