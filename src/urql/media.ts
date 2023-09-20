import { Cache, DataFields, Entity, FieldArgs, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { Media, MediaEdge } from '../generated/graphql'
import { fromScannarrUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, makeArrayResolver, makeObjectResolver, makeScalarResolver } from './utils'
import { populateEpisode } from './episode'
import { groupBy } from '../utils/groupBy'
import { groupRelatedHandles } from './utils'
import { ServerContext } from './client'

export const populateMedia = (media: Media, resolve?: (ref: any, str: string) => any) => ({
  __typename: 'Media',
  origin: (resolve ? resolve(media, 'origin') : media.origin) ?? media.origin,
  id: (resolve ? resolve(media, 'id') : media.id) ?? media.id,
  uri: (resolve ? resolve(media, 'uri') : media.uri) ?? media.uri,
  url: resolve ? resolve(media, 'url') : media.url ?? '',
  handles: {
    __typename: 'MediaConnection',
    edges:
      typeof media.handles?.edges === 'function'
        ? (
          async function *() {
            // @ts-ignore
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
  title:  media.title ?? {
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

  description: resolve ? resolve(media, 'description') : media.description ?? null,
  shortDescription: resolve ? resolve(media, 'shortDescription') : media.shortDescription ?? null,
  popularity: resolve ? resolve(media, 'popularity') : media.popularity ?? null,
  averageScore: resolve ? resolve(media, 'averageScore') : media.averageScore ?? null,
  episodeCount: resolve ? resolve(media, 'episodeCount') : media.episodeCount ?? null
})

export const serverResolvers = ({ origins, context }: { origins: any[], context?: () => Promise<ServerContext> }) => ({
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
          // @ts-ignore
          async *edges () {
            for await (const result of results) {
              if (!result.data.Media) continue
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

      const coverImageRef = (coverImageRefs as string[])?.at(Number(info.parentKey.split('.').at(-1)))
      
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
    uri: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return info.parentKey.replace('Media:', '')
      return data.uri
    },
    id: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return fromScannarrUri(info.parentKey.replace('Media:', ''))?.id
      return data.id
    },
    origin: (data, args, cache, info) => {
      if (info.parentKey.includes('scannarr')) return fromScannarrUri(info.parentKey.replace('Media:', ''))?.origin
      return data.origin
    },
    episodes: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      const parentUri = parent.uri as string | undefined
      // console.log('episodes', {...parent}, args, cache, {...info})
      if (!parentUri) {
        // console.log('result3', parent.episodes)
        return parent.episodes
      }
      const isScannarr = info.parentKey.includes('scannarr') // parentUri && isScannarrUri(parentUri)

      if (isScannarr) {
        const handlesEpisodeEdges =
          // cache.resolve(
          //   cache.resolve({ __typename: 'Media', uri: parentUri }, 'handles') as string,
          //   'edges'
          // )
            // ?.flatMap(edge => cache.resolve(cache.resolve(cache.resolve(edge, 'node'), 'episodes'), 'edges'))
          (parent as Media)
            .handles
            ?.edges
            .flatMap((edge: MediaEdge) => edge.node.episodes?.edges)
          ?? []

        // console.log(
        //   'handlesEpisodeEdges',
        //   handlesEpisodeEdges,
        //   parent
        //     .handles
        //     ?.edges
        //     .flatMap(edge => edge.node.episodes.edges)
        // )

        // const groupedByNumber = [
        //   ...groupBy(
        //     handlesEpisodeEdges,
        //     (edge) => cache.resolve(cache.resolve(edge, 'node'), 'number')
        //   ).entries()
        // ]

        const groupedByNumber = [
          ...groupBy(
            handlesEpisodeEdges,
            (edge) => edge.node.number
          ).entries()
        ]

        // console.log('groupedByNumber', groupedByNumber)

        const nodes =
          groupedByNumber
            .map(([number, edges]) => {
              const handleUris = edges?.flatMap(edge => edge.node.uri)
              // const handleUris = edges?.flatMap(edge => cache.resolve(cache.resolve(edge, 'node'), 'uri'))
              
              const res = populateEpisode({
                origin: 'scannarr',
                id: toScannarrId(handleUris),
                uri: toScannarrUri(handleUris),
                // @ts-ignore
                handles: {
                  __typename: 'EpisodeConnection',
                  edges: edges?.map(edge => ({
                    __typename: 'EpisodeEdge',
                    node:
                      populateEpisode(
                        // cache.resolve(edge, 'node'),
                        edge.node,
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
