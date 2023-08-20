import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { createYoga, createSchema, YogaInitialContext, YogaServerInstance } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import { devtoolsExchange } from '@urql/devtools'
import deepmerge from 'deepmerge'

import { OriginWithResolvers } from './server'

import { typeDefs } from './generated/schema/typeDefs.generated'

import { targets as origins } from '../../laserr/src/index'
import { fromScannarrUri, fromUri, isScannarrUri, toScannarrId, toScannarrUri} from './utils/uri2'

import { Media } from './generated/graphql'

type ServerContext = {

}

type UserContext = {

}

const makeScalarResolver =
  <T extends any>({ __typename, fieldName, defaultValue }: { __typename: string, fieldName: string, defaultValue: T }) =>
    (parent, args, cache, info) => {
      const parentUri = parent.uri as string | undefined
      if (!parentUri) return parent[fieldName]
      const isScannarr = parentUri && isScannarrUri(parentUri)

      if (isScannarr) {
        return (
          fromScannarrUri(parentUri)
            ?.handleUris
            ?.map(uri => cache.resolve({ __typename, uri }, fieldName) as string | undefined)
            .reduce(
              (acc, fieldValue) => fieldValue ?? acc,
              defaultValue
            )
        )
      }

      return cache.resolve({ __typename, uri: parentUri }, fieldName)
    }

const makeObjectResolver =
  <T extends Record<string, any>>({ __typename, fieldName, objectTypename, fields, defaultValue }: { __typename: string, objectTypename: string, fieldName: string, fields: string[], defaultValue: T }) =>
    (parent, args, cache, info) => {
      const parentUri = parent.uri as string | undefined
      if (!parentUri) return parent.fieldName
      const isScannarr = parentUri && isScannarrUri(parentUri)

      if (isScannarr) {
        return (
          fromScannarrUri(parentUri)
            ?.handleUris
            ?.map(uri => {
              const fieldRef = cache.resolve({ __typename, uri }, fieldName) as string | undefined
              return (
                fields.reduce(
                  (acc, field) => ({
                    ...acc,
                    [field]: cache.resolve(fieldRef, field)
                  }),
                  {}
                )
              )
            })
            .reduce(
              (acc, field) =>
                deepmerge(
                  acc,
                  Object.fromEntries(
                    Object
                      .entries(field)
                      .filter(([, value]) => value !== null)
                  )
                ),
              { ...defaultValue, __typename: objectTypename }
            )
        )
      }

      return {
        __typename: objectTypename,
        ...fields.reduce(
          (acc, field) => ({
            ...acc,
            [field]: cache.resolve(cache.resolve({ __typename, uri: parentUri }, fieldName), field)
          }),
          {}
        )
      }
    }

async function *getOriginResultsStreamed (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: OriginWithServer[], context?: () => Promise<ServerContext> }
) {
  const rootUri = ctx.params.variables?.uri
  const uris =
    rootUri && isScannarrUri(rootUri)
      ? fromScannarrUri(rootUri)?.handleUris
      : undefined

  const results =
    (uris ?? [undefined])
      .flatMap(uri =>
        origins
          .filter(({ origin }) => uri ? origin.supportedUris?.includes(fromUri(uri).origin) : true)
          .map(async ({ origin, server }) =>
            (async () =>
              server
                .handleRequest(
                  new Request(
                    ctx.request.url,
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        query: ctx.params.query?.replaceAll('@stream', ''),
                        variables:
                          uri
                            ? ({
                              ...ctx.params.variables,
                              uri,
                              id: fromUri(uri).id,
                              origin: fromUri(uri).origin
                            })
                            : ctx.params.variables
                      }),
                      headers: { 'Content-Type': 'application/json' }
                    }
                  ),
                  { ...await context?.(), server }
                ))()
              .then(response => response.json())
              .then(result => ({
                ...result,
                origin,
              }))
              .catch(err => {
                const error = new Error(`Error in origin for ${origin.name}:\n${err.message}`)
                error.stack = `Error in origin for ${origin.name}:\n${err.stack}`
                console.error(error)
                throw err
              })
          )
      )

    const promiseList = [...results]

    while (promiseList.length > 0) {
      const index = await Promise.race(promiseList.map((p, i) => p.then(() => i)));
      yield await promiseList[index]
      promiseList.splice(index, 1)
    }
}

type OriginWithServer = {
  origin: OriginWithResolvers
  server: YogaServerInstance<{}, {}>
}

const makeScannarr = (
  { origins: _origins, context }:
  { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> } =
  { origins: [], context: undefined }
) => {
  const origins =
    _origins
      .map(origin => ({
        origin,
        server:
          createYoga({
            schema: createSchema({
              typeDefs,
              resolvers: origin.resolvers
            }),
            plugins: [useDeferStream()]
          })
      }))

  const cache = cacheExchange({
    keys: {
      Media: (media) => {
        if (media.origin !== 'scannarr') return (media as Media).uri
        const handles = (media as Media).handles?.edges.map(handle => handle.node.uri)
        const uri = (handles && toScannarrUri(handles)) ?? (media as Media).uri
        return uri
      },
      MediaTitle: () => null,
      FuzzyDate: () => null,
    },
    resolvers: {
      Media: {
        uri: (parent, args, cache, info) => {
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
            ...(
              cache
                .resolve(cache.resolve({ __typename: 'Media', uri }, 'handles') as string, 'edges')
                ?.flatMap(edge =>
                  cache
                    .resolve(cache.resolve(cache.resolve(edge, 'node') as string, 'handles') as string, 'edges')
                    ?.map(edge => cache.resolve(edge, 'node'))
                )
            )
          ].filter(Boolean)

          const itemsSet = new Set(items.map((edge: any) => cache.resolve(edge, 'uri')))

          const uniqueItems =
            [...itemsSet].map(uri =>
              items.find((edge: any) =>
                cache.resolve(edge, 'uri') === uri
              )
            )

          // console.log(
          //   'items',
          //   items,
          //   items?.map(item => cache.resolve(item, 'uri'))
          // )

          // console.log(
          //   'uniqueItems',
          //   uniqueItems
          // )

          // console.log(
          //   'YEEEEEEEEEEEEET',
          //   // cache
          //   //   .resolve(cache.resolve(parent, 'handles'), 'edges')
          //   cache
          //     .resolve(cache.resolve({ __typename: 'Media', uri }, 'handles') as string, 'edges')
          //     ?.flatMap(edge =>
          //       cache
          //         .resolve(cache.resolve(cache.resolve(edge, 'node') as string, 'handles') as string, 'edges')
          //     )
          //     ?.map(edge =>
          //       Object.fromEntries(
          //         cache
          //           .inspectFields(edge)
          //           .map(field => ({ ...field, value: cache.resolve(edge, field.fieldKey) }))
          //           .map(field =>
          //             field.fieldName === 'node'
          //               ? [
          //                 field.fieldName,
          //                 {
          //                   ...Object.fromEntries(
          //                     cache
          //                       .inspectFields(field.value)
          //                       .map(field2 => ({ ...field2, value: cache.resolve(cache.resolve(edge, field.fieldName), field2.fieldKey) }))
          //                       .map(field2 => [
          //                         field2.fieldName,
          //                         {
          //                           value: field2.value,
          //                           field,
          //                           field2,
          //                           edge
          //                         }
          //                       ])
          //                   ),
          //                   // fieldValue: field.value,
          //                   // edge,
          //                   // edgeRef: cache.resolve(edge, field.fieldName),
          //                   // edgeRefUri: cache.resolve(cache.resolve(edge, field.fieldName), 'uri'),
          //                   // edgeRefId: cache.resolve(cache.resolve(edge, field.fieldName), 'id'),
          //                   // edgeTest: cache.resolve(`${edge}.node`, 'uri'),
          //                   // ref: field.value,
          //                   // test: cache.resolve(cache.resolve(field.value, field.fieldKey), 'uri')
          //                 }
          //               ]
          //               : [field.fieldName, field.value]  
          //           )
          //       )
          //     )
          // )

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

          // const result =
          //   [
          //     {
          //         "__typename": "MediaEdge",
          //         "node": {
          //             "averageScore": 8.28,
          //             "description": "In a trash-filled apartment, 24-year-old Akira Tendou watches a zombie movie with lifeless, envious eyes. After spending three hard years at an exploitative corporation in Japan, his spirit is broken. He can't even muster the courage to confess his feelings to his beautiful co-worker Ootori. Then one morning, he stumbles upon his landlord eating lunch—which happens to be another tenant! The whole city's swarming with zombies, and even though he's running for his life, Akira has never felt more alive!\n\n(Source: VIZ Media)",
          //             "endDate": "Media:mal:54112.endDate",
          //             "episodeCount": null,
          //             "popularity": 788,
          //             "shortDescription": "In a trash-filled apartment, 24-year-old Akira Tendou watches a zombie movie with lifeless, envious eyes. After spending three hard years at an exploitative corporation in Japan, his spirit is broken. He can't even muster the courage to confess his feelings to his beautiful co-worker Ootori. Then one morning, he stumbles upon his landlord eating lunch—which happens to be another tenant! The whole city's swarming with zombies, and even though he's running for his life, Akira has never felt more alive!\n\n(Source: VIZ Media)",
          //             "startDate": "Media:mal:54112.startDate",
          //             "title": null,
          //             "handles": "Media:mal:54112.handles",
          //             "__typename": "Media",
          //             "origin": "mal",
          //             "id": "54112",
          //             "uri": "mal:54112",
          //             "url": "https://myanimelist.net/anime/54112"
          //         }
          //     },
          //     {
          //         "__typename": "MediaEdge",
          //         "node": {
          //             "averageScore": null,
          //             "description": null,
          //             "endDate": null,
          //             "episodeCount": 12,
          //             "popularity": null,
          //             "shortDescription": null,
          //             "startDate": null,
          //             "title": "Media:anizip:17806.title",
          //             "handles": "Media:anizip:17806.handles",
          //             "__typename": "Media",
          //             "origin": "anizip",
          //             "id": "17806",
          //             "uri": "anizip:17806",
          //             "url": "https://api.ani.zip/mappings?anidb_id=17806"
          //         }
          //     },
          //     {
          //         "__typename": "MediaEdge",
          //         "node": {
          //             "averageScore": null,
          //             "description": "* Based on a black comedy dystopian manga written by <a href=\"https://anidb.net/cr40883\">Asou Haro</a> and drawn by <a href=\"https://anidb.net/cr31388\">Takata Koutarou</a>.<br><br>After spending years working for a soul-crushing company, <a href=\"https://anidb.net/ch129047\">Akira</a>'s life has lost its luster. But when a zombie apocalypse ravages his town, it gives him the push he needs to live for himself. Now Akira's on a mission to complete all 100 items on his bucket list before he...well, kicks the bucket.<br><br><i>Source: Viz</i>",
          //             "endDate": null,
          //             "episodeCount": null,
          //             "popularity": null,
          //             "shortDescription": null,
          //             "startDate": null,
          //             "title": "Media:animetosho:17806.title",
          //             "handles": "Media:animetosho:17806.handles",
          //             "__typename": "Media",
          //             "origin": "animetosho",
          //             "id": "17806",
          //             "uri": "animetosho:17806",
          //             "url": "https://animetosho.org/series/zom-100-zombie-ni-naru-made-shitai-no.17806"
          //         }
          //     },
          //     {
          //         "__typename": "MediaEdge",
          //         "node": {
          //             "averageScore": 0.8,
          //             "description": "Surviving a zombie apocalypse beats being a wage slave any day! After spending years slaving away for a soul-crushing company, Akira's life has lost its luster. He lives in a trash-filled apartment, his pay is abysmal, and he can't even muster up the nerve to confess his love to his beautiful co-worker. But when a zombie apocalypse ravages his town, it gives him the push he needs to live for himself. Now Akira's on a mission to complete all 100 items on his bucket list before he...well, kicks the bucket.\n<br><br>\n(Source: Viz Media) ",
          //             "endDate": "Media:anilist:159831.endDate",
          //             "episodeCount": 12,
          //             "popularity": 93738,
          //             "shortDescription": null,
          //             "startDate": "Media:anilist:159831.startDate",
          //             "title": "Media:anilist:159831.title",
          //             "handles": "Media:anilist:159831.handles",
          //             "__typename": "Media",
          //             "origin": "anilist",
          //             "id": "159831",
          //             "uri": "anilist:159831",
          //             "url": "https://anilist.co/anime/159831"
          //         }
          //     },
          //     {
          //         "__typename": "MediaEdge",
          //         "node": {
          //             "averageScore": null,
          //             "description": null,
          //             "endDate": null,
          //             "episodeCount": null,
          //             "popularity": null,
          //             "shortDescription": null,
          //             "startDate": null,
          //             "title": "Media:cr:GJ0H7QGQK-G68VCP8X0.title",
          //             "handles": "Media:cr:GJ0H7QGQK-G68VCP8X0.handles",
          //             "__typename": "Media",
          //             "origin": "cr",
          //             "id": "GJ0H7QGQK-G68VCP8X0",
          //             "uri": "cr:GJ0H7QGQK-G68VCP8X0",
          //             "url": "https://www.crunchyroll.com/series/G68VCP8X0"
          //         }
          //     },
          //     {
          //         "__typename": "MediaEdge",
          //         "node": {
          //             "averageScore": null,
          //             "description": null,
          //             // "endDate": null,
          //             "endDate": "Media:anidb:17806.endDate",
          //             "episodeCount": null,
          //             "popularity": null,
          //             "shortDescription": null,
          //             // "startDate": null,
          //             "startDate": "Media:anidb:17806.startDate",
          //             // "title": null,
          //             // "handles": null,
          //             "title": "Media:anidb:17806.title",
          //             "handles": "Media:anidb:17806.handles",
          //             "__typename": "Media",
          //             "origin": "anidb",
          //             "id": "17806",
          //             "uri": "anidb:17806",
          //             "url": "https://anidb.net/anime/17806"
          //         }
          //     }
          // ]

          console.log('result', result)

          // return cache.resolve({ __typename: 'Media', uri }, 'handles')

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
    }
  })

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

  const schema = createSchema({
    typeDefs,
    resolvers: {
      Query: {
        Media: async (parent, args, ctx, info) => {
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
    }
  })

  const yoga = createYoga({
    schema,
    plugins: [useDeferStream()]
  })
 
  const client = new Client({
    url: 'http://d/graphql',
    exchanges: [devtoolsExchange, cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) =>
      yoga.handleRequest(new Request(input, init), {})
  })

  return {
    yoga,
    client
  }
}

export default makeScannarr
