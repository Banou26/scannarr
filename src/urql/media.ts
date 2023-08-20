import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { ServerContext } from '.'
import { Media } from '../generated/graphql'
import { OriginWithResolvers } from '../server'
import { isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResultsStreamed, makeArrayResolver, makeObjectResolver, makeScalarResolver } from './utils'

const populateMedia = (media: Media) => ({
  origin: media.origin,
  id: media.id,
  uri: media.uri,
  url: media.url ?? null,
  handles: {
    edges:
      typeof media.handles?.edges === 'function'
        ? (
          async function *() {
            for await (const edge of media.handles?.edges()) {
              yield {
                ...edge,
                node: populateMedia(edge.node)
              }
            }
          }
        )
        : (
          media.handles?.edges.map(edge => ({
            ...edge,
            node: populateMedia(edge.node)
          })) ?? []
        )
  },
  title: media.title ?? {
    romanized: null,
    english: null,
    native: null,
  },
  startDate: media.startDate ?? {
    day: null,
    month: null,
    year: null,
  },
  endDate: media.endDate ?? {
    day: null,
    month: null,
    year: null,
  },
  
  coverImage: media.coverImage ?? [],
  trailers: media.trailers ?? [],
  externalLinks: media.externalLinks ?? [],
  bannerImage: media.bannerImage ?? [],

  description: media.description ?? null,
  shortDescription: media.shortDescription ?? null,
  popularity: media.popularity ?? null,
  averageScore: media.averageScore ?? null,
  episodeCount: media.episodeCount ?? null
})

export const serverResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  Query: {
    Media: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populateMedia({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
          async *edges (...args) {
            for await (const result of results) {
              if (!result.data.Media) continue
              yield {
                node: result.data.Media
              }
            }
          }
        }
      })
    }
  }
})

export const cacheResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  MediaCoverImage: {
    default: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      const coverImageRefs =
        cache
          .resolve(
            {
              __typename: 'Media',
              uri: info.parentKey.slice('Media:'.length, info.parentKey.indexOf('.coverImage'))
            },
            `coverImage`
          )

      const coverImageRef = coverImageRefs?.at(info.parentKey.split('.').at(-1))
      
      if (!coverImageRef) return null

      return (
        cache.resolve(coverImageRef, 'extraLarge')
        ?? cache.resolve(coverImageRef, 'large')
        ?? cache.resolve(coverImageRef, 'medium')
        ?? cache.resolve(coverImageRef, 'small')
      )
    }

  },
  Media: {
    uri: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      const parentUri = parent.uri === 'scannarr:()' ? info.parentKey.replace('Media:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.uri
      const isScannarr = parentUri && isScannarrUri(parentUri)
      const handleUris =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Media', uri: parentUri }, 'handles') as string,
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
      const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Media:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.id
      const isScannarr = parentUri && isScannarrUri(parentUri)
      const handleUris =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Media', uri: parentUri }, 'handles') as string,
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
      __typename: 'Media',
      fieldName: 'title',
      objectTypename: 'MediaTitle',
      fields: ['romanized', 'english', 'native'],
      defaultValue: {
        romanized: null,
        english: null,
        native: null,
      }
    }),
    startDate: makeObjectResolver({
      __typename: 'Media',
      fieldName: 'startDate',
      objectTypename: 'FuzzyDate',
      fields: ['day', 'month', 'year'],
      defaultValue: {
        day: null,
        month: null,
        year: null,
      }
    }),
    endDate: makeObjectResolver({
      __typename: 'Media',
      fieldName: 'endDate',
      objectTypename: 'FuzzyDate',
      fields: ['day', 'month', 'year'],
      defaultValue: {
        day: null,
        month: null,
        year: null,
      }
    }),

    coverImage: makeArrayResolver({ __typename: 'Media', fieldName: 'coverImage' }),
    trailers: makeArrayResolver({ __typename: 'Media', fieldName: 'trailers' }),
    externalLinks: makeArrayResolver({ __typename: 'Media', fieldName: 'externalLinks' }),
    bannerImage: makeArrayResolver({ __typename: 'Media', fieldName: 'bannerImage' }),

    description: makeScalarResolver({ __typename: 'Media', fieldName: 'description', defaultValue: null }),
    shortDescription: makeScalarResolver({ __typename: 'Media', fieldName: 'shortDescription', defaultValue: null }),
    popularity: makeScalarResolver({ __typename: 'Media', fieldName: 'popularity', defaultValue: null }),
    averageScore: makeScalarResolver({ __typename: 'Media', fieldName: 'averageScore', defaultValue: null }),
    episodeCount: makeScalarResolver({ __typename: 'Media', fieldName: 'episodeCount', defaultValue: null }),
  }
})
