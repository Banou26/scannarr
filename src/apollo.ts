import { InMemoryCache } from '@apollo/client/core'
import { ContextThunk } from '@apollo/server'

import type { Media, Episode, PlaybackSource } from './generated/graphql'

import makeApolloAggregator, { OriginWithResolvers } from './apollo-aggregator'
import { defaultResolvers, groupRelatedHandles, makeArrayTypePolicy, makeObjectTypePolicy, makePrimitiveTypePolicy, makeScannarrHandle } from './utils/apollo'

import schema from './graphql'
import { groupBy } from './utils/groupBy'
import { getEdges } from './utils/handle'
import { toScannarrUri } from './utils'

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
          episode: {
            merge: (existing, incoming) => incoming
          },
          media: {
            merge: (existing, incoming) => incoming
          },
          playbackSource: {
            merge: (existing, incoming) => incoming
          }
        }
      },
      Media: {
        keyFields: ['uri'],
        fields: {
          uri: {
            read: (existing, { readField }) => {
              if (readField('origin') !== 'scannarr') return existing
              if (!getEdges(readField('handles'))?.length) return existing

              return (
                toScannarrUri(
                  [
                    ...new Set(
                      getEdges(readField('handles'))
                        .map((edge: any) => readField('uri', edge.node))
                    )
                  ]
                )
              )
            }
          },
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

              const itemsSet = new Set(items.map((edge: any) => readField('uri', edge.node)))

              const uniqueItems =
                [...itemsSet].map(uri =>
                  items.find((edge: any) =>
                    readField('uri', edge.node) === uri
                  )
                )

              return {
                __typename: 'MediaConnection',
                edges: uniqueItems,
                nodes: uniqueItems.map((edge: any) => edge.node)
              }
            }
          },
          title: makeObjectTypePolicy({ fieldName: 'title', policy: policies.Media?.title }),
          startDate: makeObjectTypePolicy({ fieldName: 'startDate', policy: policies.Media?.startDate }),
          endDate: makeObjectTypePolicy({ fieldName: 'endDate', policy: policies.Media?.endDate }),
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
            'averageScore',
            'episodeCount'
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
                    ...makeScannarrHandle({ typename: 'Episode', handles: nodes, readField }),
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
      Episode: {
        keyFields: ['uri'],
        fields: {
          title: makeObjectTypePolicy({
            fieldName: 'title',
            policy: policies.Episode?.title,
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
            makePrimitiveTypePolicy({ fieldName, policy: policies.Episode?.[fieldName] })
          ]))
        }
      },
      PlaybackSource: {
        keyFields: ['uri'],
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
        episode: (_, __, { originResults }, info) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'Episode',
            results: (originResults?.flatMap(results => results.data.Page.episode ?? []) ?? []) as Episode[]
          })
          return scannarrHandles
        },
        media: (_, __, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'Media',
            results: (originResults?.flatMap(results => results.data.Page.media ?? []) ?? []) as Media[]
          })
          return scannarrHandles
        },
        playbackSource: (_, __, { originResults }) =>
          (originResults?.flatMap(results => results.data.Page.playbackSource ?? []) ?? []) as PlaybackSource[]
      },
      Query: {
        Media: (_, __, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'Media',
            results: (originResults?.flatMap(results => results.data.Media ?? []) ?? []) as Media[]
          })
          return scannarrHandles.at(0)
        },
        Episode: (_, __, { originResults }) => {
          const { scannarrHandles } = groupRelatedHandles({
            typename: 'Episode',
            results: (originResults?.flatMap(results => results.data.Episode ?? []) ?? []) as Episode[]
          })
          return scannarrHandles.at(0)
        },
        PlaybackSource: (_, __, { originResults }) =>
          ((originResults?.flatMap(results => results.data.PlaybackSource ?? []) ?? []) as PlaybackSource[])
            .at(0)
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
