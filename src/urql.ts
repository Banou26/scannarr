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
  ({ __typename, fieldName }: { __typename: string, fieldName: string }) =>
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
              (acc, fieldValue) =>
                fieldValue ?? acc,
              undefined
            )
        )
      }

      return cache.resolve({ __typename, uri: parentUri }, fieldName)
    }

const makeObjectResolver =
  ({ __typename, fieldName, objectTypename, fields }: { __typename: string, objectTypename: string, fieldName: string, fields: string[] }) =>
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
              { __typename: objectTypename }
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
        title: makeObjectResolver({
          __typename: 'Media',
          fieldName: 'title',
          objectTypename: 'MediaTitle',
          fields: ['romanized', 'english', 'native']
        }),
        startDate: makeObjectResolver({
          __typename: 'Media',
          fieldName: 'startDate',
          objectTypename: 'FuzzyDate',
          fields: ['day', 'month', 'year']
        }),
        endDate: makeObjectResolver({
          __typename: 'Media',
          fieldName: 'endDate',
          objectTypename: 'FuzzyDate',
          fields: ['day', 'month', 'year']
        }),
        description: makeScalarResolver({ __typename: 'Media', fieldName: 'description' }),
        shortDescription: makeScalarResolver({ __typename: 'Media', fieldName: 'shortDescription' }),
        popularity: makeScalarResolver({ __typename: 'Media', fieldName: 'popularity' }),
        averageScore: makeScalarResolver({ __typename: 'Media', fieldName: 'averageScore' }),
        episodeCount: makeScalarResolver({ __typename: 'Media', fieldName: 'episodeCount' }),
      }
    }
  })

  const schema = createSchema({
    typeDefs,
    resolvers: {
      Query: {
        Media: async (parent, args, ctx, info) => {
          const results = getOriginResultsStreamed({ ctx, origins, context })

          return {
            origin: 'scannarr',
            id: '()',
            uri: 'scannarr:()',
            url: null,
            handles: {
              async *edges (...args) {
                for await (const result of results) {
                  if (!result.data.Media) continue
                  yield {
                    node: result.data.Media
                  }
                }
              }
            },
            title: {
              romanized: null,
              english: null,
              native: null,
            },
            startDate: {
              day: null,
              month: null,
              year: null,
            },
            endDate: {
              day: null,
              month: null,
              year: null,
            },
            description: null,
            shortDescription: null,
            popularity: null,
            averageScore: null,
            episodeCount: null
          }
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
