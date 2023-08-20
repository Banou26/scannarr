import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { ServerContext } from '.'
import { Episode } from '../generated/graphql'
import { OriginWithResolvers } from '../server'
import { isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResultsStreamed, makeArrayResolver, makeObjectResolver, makeScalarResolver } from './utils'

export const populateEpisode = (episode: Episode) => ({
  __typename: 'Episode',
  origin: episode.origin,
  id: episode.id,
  uri: episode.uri,
  url: episode.url ?? null,
  handles: {
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
          episode.handles?.edges.map(edge => ({
            ...edge,
            node: populateEpisode(edge.node),
            __typename: 'EpisodeEdge'
          })) ?? []
        )
  },

  title: episode.title ?? {
    romanized: null,
    english: null,
    native: null,
  },

  mediaUri: episode.mediaUri ?? null,

  number: episode.number ?? null,
  description: episode.description ?? null,
  thumbnail: episode.thumbnail ?? null,
  timeUntilAiring: episode.timeUntilAiring ?? null,
  airingAt: episode.airingAt ?? null
})

export const serverResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
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
      const parentUri = parent.uri === 'scannarr:()' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.uri
      const isScannarr = parentUri && isScannarrUri(parentUri)
      const handleUris =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
          'edges'
        )
        ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'uri'))

      return (
        isScannarr
          ? toScannarrUri(handleUris)
          : parent.uri
      )
    },
    id: (parent, args, cache, info) => {
      const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.id
      const isScannarr = parentUri && isScannarrUri(parentUri)
      const handleUris =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
          'edges'
        )
        ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'uri'))

      return (
        isScannarr
          ? `(${toScannarrId(handleUris)})`
          : parent.id
      )
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
