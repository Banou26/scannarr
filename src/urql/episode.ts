import type { ServerResolverParameters } from './server'
import { Episode, EpisodePage } from '../generated/graphql'

import { map } from 'rxjs/operators'

import { fromScannarrUri } from '../utils/uri'
import { getOriginResults, getOriginResultsStreamed, groupRelatedHandles, makeObjectResolver, makeScalarResolver, makeScannarrHandle2 } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'

export const serverResolvers = ({ origins, mergeHandles }: ServerResolverParameters) => ({
  Query: {
    episode: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populateEpisode({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
          // @ts-ignore
          async *edges (...args) {
            for await (const result of results) {
              if (result.error) console.error(result.error)
              if (!result.data.episode) continue
              yield {
                __typename: 'EpisodeEdge',
                node: populateEpisode(result.data.episode)
              }
            }
          }
        }
      })
    },
    episodePage: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      for (const result of results) {
        if (!result.error) continue
        console.error(result.error)
      }

      const { scannarrHandles } = groupRelatedHandles({
        typename: 'Episode',
        results: (results?.flatMap(results => results.data.episodePage.nodes ?? []) ?? []) as Episode[]
      })

      return {
        nodes: (
          scannarrHandles
            .map(episode => populateEpisode({
              ...episode,
              handles: {
                __typename: 'EpisodeConnection',
                async *edges () {
                  for await (const edge of episode.handles.edges) {
                    yield {
                      __typename: 'EpisodeEdge',
                      node: edge.node
                    }
                  }
                }
              }
            }))
        )
      }
    }
  },
  Subscription: {
    episode: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            results:
              subscribeToOrigins({
                origins,
                context,
                name: 'episode'
              }),
            mergeHandles,
            name: 'episode'
          })
        )
    },
    episodePage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            origins,
            context,
            name: 'episodePage'
          }).pipe(
            map(results => {
              const { handleGroups } = groupRelatedHandles({
                results:
                  results
                    .map(result => result.data?.episodePage as EpisodePage)
                    .flatMap(episodePage => episodePage?.nodes ?? [])
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
                episodePage: {
                  edges: scannarrHandles.map(episode => ({ node: episode })),
                  nodes: scannarrHandles
                }
              }
            })
          )
        )
    }
  }
})

export const cacheResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
  Episode: {
    uri: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return info.parentKey.replace('Episode:', '')
      return data.uri
    },
    id: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return fromScannarrUri(info.parentKey.replace('Episode:', ''))?.id
      return data.id
    },
    origin: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return fromScannarrUri(info.parentKey.replace('Episode:', ''))?.origin
      return data.origin
    },
    title: makeObjectResolver({
      __typename: 'Episode',
      fieldName: 'title',
      objectTypename: 'MediaTitle',
      fields: ['romanized', 'english', 'native'],
      defaultValue: {
        romanized: null,
        english: null,
        native: null,
      }
    }),
    number: makeScalarResolver({ __typename: 'Episode', fieldName: 'number', defaultValue: null }),
    thumbnail: makeScalarResolver({ __typename: 'Episode', fieldName: 'thumbnail', defaultValue: null }),
    timeUntilAiring: makeScalarResolver({ __typename: 'Episode', fieldName: 'timeUntilAiring', defaultValue: null }),
    airingAt: makeScalarResolver({ __typename: 'Episode', fieldName: 'airingAt', defaultValue: null }),
    description: makeScalarResolver({ __typename: 'Episode', fieldName: 'description', defaultValue: null }),
  }
})
