import { Episode } from '../generated/graphql'
import { fromScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, groupRelatedHandles, makeObjectResolver, makeScalarResolver } from './utils'
import { populateMedia } from './media'
import { ServerContext } from './client'

export const populateEpisode = (episode: Episode, resolve?: (ref: any, str: string) => any) => ({
  __typename: 'Episode',
  origin: (resolve ? resolve(episode, 'origin') : episode.origin) ?? episode.origin,
  id: (resolve ? resolve(episode, 'id') : episode.id) ?? episode.id,
  uri: (resolve ? resolve(episode, 'uri') : episode.uri) ?? episode.uri,
  url: (resolve ? resolve(episode, 'url') : (episode.url ?? '')) ?? '',
  handles:
    (episode.handles ?? {
      __typename: 'EpisodeConnection',
      edges:
        typeof (episode as Episode).handles?.edges === 'function'
          ? (
            async function *() {
              // @ts-ignore
              for await (const edge of (episode as Episode).handles?.edges()) {
                yield {
                  ...edge,
                  node: populateEpisode(edge.node),
                  __typename: 'EpisodeEdge'
                }
              }
            }
          )
          : (
            (episode as Episode).handles?.edges.map(edge =>
              typeof edge.node === 'string'
                ? ({ node: edge.node, __typename: 'EpisodeEdge' })
                : ({
                  ...edge,
                  node: populateEpisode(edge.node),
                  __typename: 'EpisodeEdge'
                })  
            ) ?? []
          )
    }),

  title: episode.title ?? {
    romanized: null,
    english: null,
    native: null,
  },

  media:
    populateMedia({
      origin: 'scannarr',
      id: '()',
      uri: 'scannarr:()',
      handles: {
        edges: [],
        nodes: []
      }
    }),
  number: resolve ? resolve(episode, 'number') : (episode.number ?? null),
  description: resolve ? resolve(episode, 'description') : (episode.description ?? null),
  thumbnail: resolve ? resolve(episode, 'thumbnail') : (episode.thumbnail ?? null),
  timeUntilAiring: resolve ? resolve(episode, 'timeUntilAiring') : (episode.timeUntilAiring ?? null),
  airingAt: resolve ? resolve(episode, 'airingAt') : ( episode.airingAt ?? null)
})

export const serverResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
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
              if (!result.data.Episode) continue
              yield {
                __typename: 'EpisodeEdge',
                node: populateEpisode(result.data.Episode)
              }
            }
          }
        }
      })
    },
    episodePage: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'Episode',
        results: (results?.flatMap(results => results.data.episodePage.nodes ?? []) ?? []) as Episode[]
      })

      return (
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
