import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import makeApolloAggregator, { OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers, groupRelatedHandles, makeArrayTypePolicy, makeObjectTypePolicy, makePrimitiveTypePolicy, makeScannarrHandle } from './utils/apollo'
import { Media } from './generated/graphql'

import schema from './graphql'
import { groupBy } from './utils/groupBy'

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
          title: makeObjectTypePolicy({ fieldName: 'title', policy: policies.Media?.title }),
          ...Object.fromEntries([
            'trailers',
            'coverImage',
            'externalLinks',
            'bannerImage'
          ].map(fieldName => [
            fieldName,
            makeArrayTypePolicy({ fieldName, policy: policies.Media?.[fieldName] })
          ])),
          ...Object.fromEntries([
            'description',
            'shortDescription',
            'popularity',
            'averageScore'
          ].map(fieldName => [
            fieldName,
            makePrimitiveTypePolicy({ fieldName, policy: policies.Media?.[fieldName] })
          ])),
          episodes: {
            read: (existing, { readField, toReference }) => {
              if (readField('origin') !== 'scannarr') return existing

              const handlesOriginValues =
                readField('handles')
                  .edges
                  .flatMap((edge: any) =>
                    readField('episodes', edge.node)
                      ?.edges
                      ?.map((edge: any) => edge.node)
                  )
              const groupedByNumber = [
                ...groupBy(
                  handlesOriginValues,
                  (node) => readField('number', node)
                ).entries()
              ]

              console.log('groupedByNumber', groupedByNumber)

              console.log(
                'scannarrHandles',
                groupedByNumber.map(([number, nodes]) =>
                  makeScannarrHandle({ typename: 'MediaEpisode', handles: nodes, readField })
                )
              )

              const nodes =
                groupedByNumber
                  .map(([number, nodes]) => ({
                    ...makeScannarrHandle({ typename: 'MediaEpisode', handles: nodes, readField }),
                    media: toReference(`Media:{"uri":"${readField('uri')}"}`),
                    mediaUri: readField('uri')
                  }))

              console.log(
                'nodes',
                nodes
              )

              return {
                edges: nodes.map((node) => ({ node })),
                nodes
              }
            }
          }
        }
      },
      MediaEpisode: {
        keyFields: ['uri'],
        fields: {
          title: makeObjectTypePolicy({ fieldName: 'title', policy: policies.MediaEpisode?.title }),
          ...Object.fromEntries([
            'airingAt',
            'number',
            'description',
            'thumbnail',
            'timeUntilAiring'
          ].map(fieldName => [
            fieldName,
            makePrimitiveTypePolicy({ fieldName, policy: policies.MediaEpisode?.[fieldName] })
          ]))
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
            typename: 'Media',
            results: (originResults?.flatMap(results => results.data.Page.media ?? []) ?? []) as Media[]
          })
          console.log('Page.media scannarrHandles', scannarrHandles, originResults)
          return scannarrHandles
        }
      },
      Query: {
        Media: (_, { id }, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'Media',
            results: (originResults?.flatMap(results => results.data.Media ?? []) ?? []) as Media[]
          })
          console.log('Query.Media scannarrHandles', scannarrHandles, originResults)
          return scannarrHandles.at(0)
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
