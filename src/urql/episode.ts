import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { Episode } from '../generated/graphql'
import { isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, groupRelatedHandles, makeArrayResolver, makeObjectResolver, makeScalarResolver, makeScannarrHandle } from './utils'
import { populateMedia } from './media'

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
        typeof episode.handles?.edges === 'function'
          ? (
            async function *() {
              for await (const edge of episode.handles?.edges()) {
                yield {
                  ...edge,
                  node: populateEpisode(edge.node),
                  __typename: 'EpisodeEdge'
                }
              }
            }
          )
          : (
            episode.handles?.edges.map(edge =>
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

export const serverResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  Page: {
    episode: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'Episode',
        results: (results?.flatMap(results => results.data.Page.episode ?? []) ?? []) as Episode[]
      })
      const res = scannarrHandles.slice(0, 1).map(episode => populateEpisode({
        ...episode,
        handles: {
          __typename: 'EpisodeConnection',
          async *edges () {
            await new Promise((resolve) => setTimeout(resolve, 10))
            for await (const edge of episode.handles.edges) {
              yield {
                __typename: 'EpisodeEdge',
                node: edge.node
              }
            }
          }
        }
      }))
      console.log('Page.episode res', res)
      return res
    }
    // episode: async (parent, args, ctx, info) => ([
    //   {
    //     __typename: 'Episode',
    //     uri: 'scannarr:()',
    //     handles: {
    //       __typename: 'EpisodeConnection',
    //       // edges: [{
    //       //   node: {
    //       //     __typename: 'Episode',
    //       //     uri: '2',
    //       //     bar: 'bar',
    //       //     handles: {
    //       //       __typename: 'EpisodeConnection',
    //       //       edges: []
    //       //     },
    //       //     media: {
    //       //       __typename: 'Media',
    //       //       uri: '12',
    //       //       handles: {
    //       //         __typename: 'MediaConnection',
    //       //         edges: []
    //       //       }
    //       //     }
    //       //   }
    //       // }]
    //       async *edges () {
    //         await new Promise((resolve) => setTimeout(resolve, 1000))
    //         yield {
    //           node: {
    //             __typename: 'Episode',
    //             uri: '2',
    //             bar: 'bar',
    //             handles: {
    //               __typename: 'EpisodeConnection',
    //               edges: []
    //             },
    //             media: {
    //               __typename: 'Media',
    //               uri: '12',
    //               handles: {
    //                 __typename: 'MediaConnection',
    //                 edges: []
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // ])
  },
  Query: {
    Episode: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populateEpisode({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
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
    }
  }
})

export const cacheResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  Episode: {
    uri: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      // console.log('RESOLVE Episode', parent, args, cache, {...info})
      if (info.parentKey.includes('scannarr')) return info.parentKey.replace('Episode:', '')
      return parent.uri
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
