import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { createYoga, createSchema, YogaServer, YogaInitialContext, YogaServerInstance } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import { devtoolsExchange } from '@urql/devtools'
import deepmerge from 'deepmerge'

import { OriginWithResolvers } from './server'

import { typeDefs } from './generated/schema/typeDefs.generated'
import { resolvers } from './generated/schema/resolvers.generated'

import { targets as origins } from '../../laserr/src/index'
import { fromScannarrUri, fromUri, isScannarrUri, isUri, toScannarrUri} from './utils/uri2'

import { fetch } from '../../oz/OL/src/utils/fetch'
import { Media } from './generated/graphql';

type ServerContext = {

}

type UserContext = {

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

const makeScannarr = async (
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
      Media: (media) => (media as Media).uri,
      MediaTitle: () => null
    },
    resolvers: {
      Media: {
        uri: (parent, args, cache, info) => {
          const parentUri = parent.uri as string | undefined
          if (!parentUri) return null
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
        title: (parent, args, cache, info) => {
          const parentUri = parent.uri as string | undefined
          if (!parentUri) return null
          const isScannarr = parentUri && isScannarrUri(parentUri)

          if (isScannarr) {
            return (
              fromScannarrUri(parentUri)
                ?.handleUris
                ?.map(uri => {
                  const titleRef = cache.resolve({ __typename: 'Media', uri }, 'title') as string | undefined
                  return {
                    romanized: cache.resolve(titleRef, 'romanized'),
                    english: cache.resolve(titleRef, 'english'),
                    native: cache.resolve(titleRef, 'native'),
                  }
                })
                .reduce(
                  (acc, title) =>
                    deepmerge(
                      acc,
                      Object.fromEntries(
                        Object
                          .entries(title)
                          .filter(([, value]) => value !== null)
                      )
                    ),
                  { __typename: 'MediaTitle' }
                )
            )

          }

          return {
            __typename: 'MediaTitle',
            romanized: cache.resolve(cache.resolve({ __typename: 'Media', uri: parentUri }, 'title'), 'romanized'),
            english: cache.resolve(cache.resolve({ __typename: 'Media', uri: parentUri }, 'title'), 'english'),
            native: cache.resolve(cache.resolve({ __typename: 'Media', uri: parentUri }, 'title'), 'native'),
          }
        }
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
            origin: '',
            id: '',
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
            }
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
    url: 'http://localhost:3000/graphql',
    exchanges: [devtoolsExchange, cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) =>
      yoga.handleRequest(new Request(input, init), {})
  })

  const { unsubscribe } =
    client
      .query(`#graphql
        fragment GetMediaTestFragment on Media {
          origin
          id
          uri
          url
          title {
            romanized
            english
            native
          }
        }

        query GetMediaTest($uri: String!, $origin: String, $id: String) {
          Media(uri: $uri, origin: $origin, id: $id) {
            ...GetMediaTestFragment
            handles {
              edges @stream {
                node {
                  ...GetMediaTestFragment
                }
              }
            }
          }
        }
    `, { uri: 'scannarr:(mal:54112,anizip:17806,anilist:159831,animetosho:17806,cr:GJ0H7QGQK,anidb:17806,kitsu:46954,notifymoe:fJAnfp24g,livechart:11767,tvdb:429310)' })
    .subscribe(async ({ data, error, hasNext }) => {
      if (error) return console.error(error)
      console.log(
        'data',
        data?.Media,
        data.Media.title,
        data?.Media.handles.edges
      )
      if (!hasNext) setTimeout(() => unsubscribe(), 0)
    })

}

makeScannarr({
  origins,
  context: async () => ({
    fetch
  })
})

export default makeScannarr
