import { DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { ServerContext } from '.'
import { Media } from '../generated/graphql'
import { OriginWithResolvers } from '../server'
import { isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResultsStreamed, makeObjectResolver, makeScalarResolver } from './utils'

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
    handles: (parent, args, cache, info) => {
      if (parent.origin !== 'scannarr' && parent.uri) return cache.resolve({ __typename: 'Media', uri: parent.uri }, 'handles')

      console.log('handles', parent, args, cache, { ...info })
      const uri = info.parentKey.replace('Media:', '')
      
      const items = [
        ...(
          cache
            .resolve(cache.resolve({ __typename: 'Media', uri }, 'handles') as string, 'edges')
            ?.map(edge => cache.resolve(edge, 'node'))
        ),
        // ...(
        //   cache
        //     .resolve(cache.resolve({ __typename: 'Media', uri }, 'handles') as string, 'edges')
        //     ?.flatMap(edge =>
        //       cache
        //         .resolve(cache.resolve(cache.resolve(edge, 'node') as string, 'handles') as string, 'edges')
        //         ?.map(edge => cache.resolve(edge, 'node'))
        //     )
        // )
      ].filter(Boolean)

      const itemsSet = new Set(items.map((edge: any) => cache.resolve(edge, 'uri')))

      const uniqueItems =
        [...itemsSet].map(uri =>
          items.find((edge: any) =>
            cache.resolve(edge, 'uri') === uri
          )
        )


      const result =
        uniqueItems.map(edge => ({
          __typename: 'MediaEdge',
          node: {
            averageScore: null,
            description: null,
            endDate: null,
            episodeCount: null,
            popularity: null,
            shortDescription: null,
            startDate: null,
            title: null,
            ...Object.fromEntries(
              cache
                .inspectFields(edge)
                .map(field => ({ ...field, value: cache.resolve(edge, field.fieldKey) }))
                .map(field =>
                  field.fieldName === 'node'
                    ? [
                      field.fieldName,
                      {
                        averageScore: null,
                        description: null,
                        endDate: null,
                        episodeCount: null,
                        popularity: null,
                        shortDescription: null,
                        startDate: null,
                        title: null,
                        ...Object.fromEntries(
                          cache
                            .inspectFields(field.value)
                            .map(field2 => ({ ...field2, value: cache.resolve(cache.resolve(edge, field.fieldName), field2.fieldKey) }))
                            .map(field2 => [field2.fieldName, field2.value])
                            .filter(([fieldName, fieldValue]) => fieldValue !== null)
                        )
                      }
                    ]
                    : [field.fieldName, field.value]
                )
            )
          }
        }))

      return ({
        __typename: 'MediaConnection',
        edges: result
      })
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
    description: makeScalarResolver({ __typename: 'Media', fieldName: 'description', defaultValue: null }),
    shortDescription: makeScalarResolver({ __typename: 'Media', fieldName: 'shortDescription', defaultValue: null }),
    popularity: makeScalarResolver({ __typename: 'Media', fieldName: 'popularity', defaultValue: null }),
    averageScore: makeScalarResolver({ __typename: 'Media', fieldName: 'averageScore', defaultValue: null }),
    episodeCount: makeScalarResolver({ __typename: 'Media', fieldName: 'episodeCount', defaultValue: null }),
  }
})
