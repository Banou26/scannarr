import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { PlaybackSource, Team } from '../generated/graphql'
import { fromScannarrUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, groupRelatedHandles, makeArrayResolver, makeObjectResolver, makeScalarResolver } from './utils'
import { ServerContext } from './client'

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
        typeof (playbackSource as PlaybackSource).handles?.edges === 'function'
          ? (
            async function *() {
              // @ts-ignore
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
            (playbackSource as PlaybackSource).handles?.edges.map(edge =>
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

  team: resolve ? resolve(playbackSource, 'team') : (playbackSource.team ?? null),
  // team: playbackSource.team ?? {
  //   __typename: 'Team',
  //   origin: resolve ? resolve(resolve(playbackSource, 'team'), 'origin') : (playbackSource?.team?.origin ?? null),
  //   id: resolve ? resolve(resolve(playbackSource, 'team'), 'id') : (playbackSource?.team?.id ?? null),
  //   uri: resolve ? resolve(resolve(playbackSource, 'team'), 'uri') : (playbackSource?.team?.uri ?? null),
  //   url: resolve ? resolve(resolve(playbackSource, 'team'), 'url') : (playbackSource?.team?.url ?? null),
  //   name: resolve ? resolve(resolve(playbackSource, 'team'), 'name') : (playbackSource?.team?.name ?? null)
  // },

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

export const serverResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
  Query: {
    playbackSource: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populatePlaybackSource({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
          // @ts-ignore
          async *edges (...args) {
            for await (const result of results) {
              if (!result.data.playbackSource) continue
              yield {
                __typename: 'PlaybackSourceEdge',
                node: populatePlaybackSource(result.data.playbackSource)
              }
            }
          }
        }
      })
    },
    playbackSourcePage: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'PlaybackSource',
        results: (results?.flatMap(results => results.data.playbackSourcePage.nodes ?? []) ?? []) as PlaybackSource[]
      })
      return scannarrHandles.map((handle) => populatePlaybackSource(handle))
    }
  }
})

export const cacheResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
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

    team: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) {
        const result =
          fromScannarrUri(info.parentKey.replace('PlaybackSource:', ''))
            ?.handleUris
            ?.map(uri => {
              const fieldRef = cache.resolve({ __typename: 'PlaybackSource', uri }, 'team') as string | undefined
              return {
                __typename: 'Team',
                origin: cache.resolve(fieldRef, 'origin'),
                id: cache.resolve(fieldRef, 'id'),
                uri: cache.resolve(fieldRef, 'uri'),
                url: cache.resolve(fieldRef, 'url'),
                name: cache.resolve(fieldRef, 'name')
              }
            })
            .reduce((acc, cur) => ({
              __typename: 'Team',
              origin: acc.origin ?? cur.origin ?? '',
              id: acc.id ?? cur.id ?? '',
              uri: acc.uri ?? cur.uri ?? '',
              url: acc.url ?? cur.url,
              name: acc.name ?? cur.name
            }) as Team, {} as Team)

        //! ??????????????? WHY DO I NEED THIS
        // todo: fix this
        if (!data.team) {
          data.team = result
        }
        return result
      }
      return data.team
    },

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
