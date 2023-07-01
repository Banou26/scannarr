import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import makeApolloAggregator, { OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers, groupRelatedHandles, makeArrayTypePolicy, makeObjectTypePolicy, makePrimitiveTypePolicy, makeScannarrHandle } from './utils/apollo'
import { Media, MediaEpisode } from './generated/graphql'

import schema from './graphql'
import { groupBy } from './utils/groupBy'
import { getEdges } from './utils/handle'

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
          // uri: {
          //   read: (existing, { readField }) => {
          //     if (readField('origin') !== 'scannarr') return existing
          //     if (!readField('handles')?.edges?.length) return existing

          //     // console.log(
          //     //   'TO SCANNARR URI',
          //     //   existing,
          //     //   toScannarrUri(
          //     //     readField('handles')
          //     //       .edges
          //     //       .map((edge: any) => readField('uri', edge.node))
          //     //   )
          //     // )
          //     return (
          //       toScannarrUri(
          //         readField('handles')
          //           .edges
          //           .map((edge: any) => readField('uri', edge.node))
          //       )
          //     )
          //   }
          // },
          handles: {
            read: (existing, { readField }) => {
              if (readField('origin') !== 'scannarr') return existing
              if (!existing) return existing
              const items = [
                ...getEdges(existing) ?? [],
                ...(
                  getEdges(existing)
                    ?.flatMap(edge =>
                      readField('handles', edge.node)
                        ? getEdges(readField('handles', edge.node), readField)
                        : []
                    )
                )
              ]
              return {
                __typename: 'MediaConnection',
                edges: items,
                nodes: items.map((edge: any) => edge.node)
              }
            }
          },
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
                getEdges(readField('handles'))
                  .flatMap((edge) =>
                    getEdges(readField('episodes', edge.node))
                      ?.map((edge) => edge.node)
                  )

              const groupedByNumber = [
                ...groupBy(
                  handlesOriginValues,
                  (node) => readField('number', node)
                ).entries()
              ]

              const nodes =
                groupedByNumber
                  .map(([number, nodes]) => ({
                    ...makeScannarrHandle({ typename: 'MediaEpisode', handles: nodes, readField }),
                    media: toReference(`Media:{"uri":"${readField('uri')}"}`),
                    mediaUri: readField('uri')
                  }))

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
          title: makeObjectTypePolicy({
            fieldName: 'title',
            policy: policies.MediaEpisode?.title,
            defaultValue: { romanized: null, native: null, english: null }
          }),
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
          return scannarrHandles
        }
      },
      Query: {
        Media: (_, { id }, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'Media',
            results: (originResults?.flatMap(results => results.data.Media ?? []) ?? []) as Media[]
          })
          return scannarrHandles.at(0)
        },
        Episode: (_, { id }, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'MediaEpisode',
            results: (originResults?.flatMap(results => results.data.Episode ?? []) ?? []) as MediaEpisode[]
          })
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
