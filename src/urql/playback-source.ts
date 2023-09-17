import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { ServerContext } from '.'
import { PlaybackSource } from '../generated/graphql'
import { OriginWithResolvers } from '../server'
import { fromScannarrUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, groupRelatedHandles, makeArrayResolver, makeObjectResolver, makeScalarResolver } from './utils'

export const populatePlaybackSource = (playbackSource: PlaybackSource, resolve?: (ref: any, str: string) => any) => ({
  __typename: 'PlaybackSource',
  origin: resolve ? resolve(playbackSource, 'origin') : playbackSource.origin,
  id: resolve ? resolve(playbackSource, 'id') : playbackSource.id,
  uri: resolve ? resolve(playbackSource, 'uri') : playbackSource.uri,
  url: resolve ? resolve(playbackSource, 'url') : (playbackSource.url ?? null),
  handles:
    (playbackSource.handles ?? {
      __typename: 'PlaybackSourceConnection',
      edges:
        typeof playbackSource.handles?.edges === 'function'
          ? (
            async function *() {
              for await (const edge of playbackSource.handles?.edges()) {
                yield {
                  ...edge,
                  node: populatePlaybackSource(edge.node),
                  __typename: 'PlaybackSourceEdge'
                }
              }
            }
          )
          : (
            playbackSource.handles?.edges.map(edge =>
              typeof edge.node === 'string'
                ? ({ node: edge.node, __typename: 'PlaybackSourceEdge' })
                : ({
                  ...edge,
                  node: populatePlaybackSource(edge.node),
                  __typename: 'PlaybackSourceEdge'
                })  
            ) ?? []
          )
    }),

  title: playbackSource.title ?? {
    romanized: null,
    english: null,
    native: null,
  },

  media: null,
  episode: null,

  team: null,

  thumbnails: [],

  type: resolve ? resolve(playbackSource, 'type') : (playbackSource.type ?? null),
  filename: resolve ? resolve(playbackSource, 'filename') : (playbackSource.filename ?? null),
  structure: resolve ? resolve(playbackSource, 'structure') : (playbackSource.structure ?? null),
  filesCount: resolve ? resolve(playbackSource, 'filesCount') : (playbackSource.filesCount ?? null),
  bytes: resolve ? resolve(playbackSource, 'bytes') : (playbackSource.bytes ?? null),
  uploadDate: resolve ? resolve(playbackSource, 'uploadDate') : (playbackSource.uploadDate ?? null),
  resolution: resolve ? resolve(playbackSource, 'resolution') : (playbackSource.resolution ?? null),
  hash: resolve ? resolve(playbackSource, 'hash') : (playbackSource.hash ?? null),
  format: resolve ? resolve(playbackSource, 'format') : (playbackSource.format ?? null),
  episodeRange: resolve ? resolve(playbackSource, 'episodeRange') : (playbackSource.episodeRange ?? null),
  data: resolve ? resolve(playbackSource, 'data') : (playbackSource.data ?? null)
})

export const serverResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  Page: {
    playbackSource: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      console.log('results', results)
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'PlaybackSource',
        results: (results?.flatMap(results => results.data.Page.playbackSource ?? []) ?? []) as PlaybackSource[]
      })
      return scannarrHandles.map((handle) => populatePlaybackSource(handle))
    }
  },
  Query: {
    PlaybackSource: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populatePlaybackSource({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
          async *edges (...args) {
            for await (const result of results) {
              if (!result.data.PlaybackSource) continue
              yield {
                __typename: 'PlaybackSourceEdge',
                node: populatePlaybackSource(result.data.PlaybackSource)
              }
            }
          }
        }
      })
    }
  }
})

export const cacheResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  PlaybackSource: {
    uri: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return info.parentKey.replace('PlaybackSource:', '')
      return data.uri
    },
    id: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return fromScannarrUri(info.parentKey.replace('PlaybackSource:', ''))?.id
      return data.id
    },
    origin: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return fromScannarrUri(info.parentKey.replace('PlaybackSource:', ''))?.origin
      return data.origin
    },

    title: makeObjectResolver({
      __typename: 'PlaybackSource',
      fieldName: 'title',
      objectTypename: 'MediaTitle',
      fields: ['romanized', 'english', 'native'],
      defaultValue: {
        romanized: null,
        english: null,
        native: null,
      }
    }),

    thumbnails: makeArrayResolver({ __typename: 'PlaybackSource', fieldName: 'thumbnails' }),

    type: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'type', defaultValue: null }),
    filename: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'filename', defaultValue: null }),
    structure: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'structure', defaultValue: null }),
    filesCount: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'filesCount', defaultValue: null }),
    bytes: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'bytes', defaultValue: null }),
    uploadDate: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'uploadDate', defaultValue: null }),
    resolution: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'resolution', defaultValue: null }),
    hash: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'hash', defaultValue: null }),
    format: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'format', defaultValue: null }),
    episodeRange: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'episodeRange', defaultValue: null }),
    data: makeScalarResolver({ __typename: 'PlaybackSource', fieldName: 'data', defaultValue: null }),
  }
})
