import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { ServerContext } from '.'
import { Media } from '../generated/graphql'
import { OriginWithResolvers } from '../server'
import { fromScannarrUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, makeArrayResolver, makeObjectResolver, makeScalarResolver } from './utils'
import { populateEpisode } from './episode'
import { groupBy } from '../utils/groupBy'
import { groupRelatedHandles } from './utils'

export const populateMedia = (media: Media, resolve?: (ref: any, str: string) => any) => ({
  __typename: 'Media',
  origin: media.origin,
  id: media.id,
  uri: media.uri,
  url: media.url ?? null,
  handles: {
    __typename: 'MediaConnection',
    edges:
      typeof media.handles?.edges === 'function'
        ? (
          async function *() {
            for await (const edge of media.handles?.edges()) {
              yield {
                ...edge,
                node: populateMedia(edge.node),
                __typename: 'MediaEdge'
              }
            }
          }
        )
        : (
          media.handles?.edges.map(edge => ({
            ...edge,
            node: populateMedia(edge.node),
            __typename: 'MediaEdge'
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

  episodes: {
    __typename: 'EpisodeConnection',
    edges:
      media.episodes?.edges.map(edge => ({
        ...edge,
        node: populateEpisode(edge.node),
        __typename: 'EpisodeEdge'
      }))
      ?? []
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
  Page: {
    media: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'Media',
        results: (results?.flatMap(results => results.data.Page.media ?? []) ?? []) as Media[]
      })
      return scannarrHandles.map(media => populateMedia(media))
    }
  },
  Query: {
    Media: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populateMedia({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
          __typename: 'MediaConnection',
          async *edges (...args) {
            for await (const result of results) {
              if (!result.data.Media) continue
              // console.log('yield', {
              //   __typename: 'MediaEdge',
              //   node: populateMedia(result.data.Media)
              // })
              yield {
                __typename: 'MediaEdge',
                node: populateMedia(result.data.Media)
              }
            }
          }
        }
      })
    }
  }
})

export const cacheResolvers = ({ context }: { context?: () => Promise<ServerContext> }) => ({
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
      // console.log('Media.uri', parent, args, cache, {...info})
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
    id: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
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

    episodes: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      const parentUri = parent.uri as string | undefined
      // console.log('episodes', parent, args, cache, {...info})
      if (!parentUri) {
        // console.log('result3', parent.episodes)
        return parent.episodes
      }
      const isScannarr = parentUri && isScannarrUri(parentUri)

      if (isScannarr) {
        const handlesEpisodeEdges =
          cache.resolve(
            cache.resolve({ __typename: 'Media', uri: parentUri }, 'handles') as string,
            'edges'
          )
          ?.flatMap(edge => cache.resolve(cache.resolve(cache.resolve(edge, 'node'), 'episodes'), 'edges'))

        // console.log('handlesEpisodeEdges', handlesEpisodeEdges)

        const groupedByNumber = [
          ...groupBy(
            handlesEpisodeEdges,
            (edge) => cache.resolve(cache.resolve(edge, 'node'), 'number')
          ).entries()
        ]

        // console.log('groupedByNumber', groupedByNumber)

        const nodes =
          groupedByNumber
            .map(([number, edges]) => {
              const handleUris = edges?.flatMap(node => cache.resolve(cache.resolve(node, 'node'), 'uri'))
              
              const res = populateEpisode({
                origin: 'scannarr',
                id: toScannarrId(handleUris),
                uri: toScannarrUri(handleUris),
                handles: {
                  __typename: 'EpisodeConnection',
                  edges: edges?.map(edge => ({
                    __typename: 'EpisodeEdge',
                    node:
                      populateEpisode(
                        cache.resolve(edge, 'node'),
                        (entity: Entity, fieldName: string, args?: FieldArgs) =>
                          cache.resolve(entity, fieldName, args)
                      )
                  }))
                },
                number: Number(number),

                thumbnail: makeScalarResolver({ __typename: 'Episode', fieldName: 'thumbnail', defaultValue: null })({ uri: toScannarrUri(handleUris) }, undefined, cache, info),
                timeUntilAiring: makeScalarResolver({ __typename: 'Episode', fieldName: 'timeUntilAiring', defaultValue: null })({ uri: toScannarrUri(handleUris) }, undefined, cache, info),
                airingAt: makeScalarResolver({ __typename: 'Episode', fieldName: 'airingAt', defaultValue: null })({ uri: toScannarrUri(handleUris) }, undefined, cache, info),
                description: makeScalarResolver({ __typename: 'Episode', fieldName: 'description', defaultValue: null })({ uri: toScannarrUri(handleUris) }, undefined, cache, info),
              })

              // console.log(
              //   'episodes handleUris',
              //   handleUris,
              //   edges,
              //   res
              // )
              return res
            })

        // console.log('nodes', nodes)

        const result = {
          __typename: 'EpisodeConnection',
          edges: nodes?.flatMap(node => ({ __typename: 'EpisodeEdge', node })) ?? []
        }

        // console.log('result', result)

        return result
      }
      // console.log('result2', cache.resolve({ __typename: 'Media', uri: parentUri }, 'episodes'))

      return cache.resolve({ __typename: 'Media', uri: parentUri }, 'episodes')
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
