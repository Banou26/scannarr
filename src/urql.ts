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
import { fromScannarrUri, fromUri, fromUris, isScannarrUri, isUri, joinUris, mergeScannarrUris, toScannarrUri } from './utils'

import { fetch } from '../../oz/OL/src/utils/fetch'

type ServerContext = {

}

type UserContext = {

}

const getOriginResults = async (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: OriginWithServer[], context?: () => Promise<ServerContext> }
) => {
  const rootUri = ctx.params.variables?.uri
  const uris =
    rootUri && isUri(rootUri) && rootUri.startsWith('scannarr:')
      ? fromScannarrUri(rootUri)
      : undefined

  const results =
    await Promise.all(
      (await Promise.allSettled(
        (uris ?? [undefined])
          .flatMap(uri =>
            origins?.map(async ({ origin, server }) =>
              (async () =>
                server
                  .handleRequest(
                    new Request(
                      ctx.request.url,
                      {
                        method: 'POST',
                        body: JSON.stringify({
                          query: ctx.params.query,
                          variables:
                            uri
                              ? ({
                                ...ctx.params.variables,
                                uri,
                                handler: fromUri(uri).handler,
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
                  if (!silenceResolverErrors) {
                    const error = new Error(`Error in origin for ${origin.name}:\n${err.message}`)
                    error.stack = `Error in origin for ${origin.name}:\n${err.stack}`
                    console.error(error)
                  }
                  throw err
                })
            )
          )
      ))
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<any>).value)
        .filter((result) =>
          result !== undefined
          && result !== null
          && Object.values(result.data).some((value) => value !== undefined && value !== null)
        )
    )

  return results
}

async function* unorderedPromisesToGenerator<T>(promises: Promise<T>[]): AsyncGenerator<T> {
  let promiseList = promises.slice(); // clone the list to avoid mutating the original

  while (promiseList.length > 0) {
      let index = await Promise.race(promiseList.map((p, i) => p.then(() => i)));
      
      yield await promiseList[index];

      // Remove the promise we just handled
      promiseList.splice(index, 1);
  }
}

async function *getOriginResultsStreamed (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: OriginWithServer[], context?: () => Promise<ServerContext> }
) {
  const rootUri = ctx.params.variables?.uri
  const uris =
    rootUri && isUri(rootUri) && rootUri.startsWith('scannarr:')
      ? fromScannarrUri(rootUri)
      : undefined

  const results =
    (uris ?? [undefined])
      .flatMap(uri =>
        origins
          .filter(({ origin }) => origin.supportedUris?.includes(fromUri(uri).origin))
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
                              handler: fromUri(uri).handler,
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
                // if (!silenceResolverErrors) {
                  const error = new Error(`Error in origin for ${origin.name}:\n${err.message}`)
                  error.stack = `Error in origin for ${origin.name}:\n${err.stack}`
                  console.error(error)
                // }
                throw err
              })
          )
      )

    let promiseList = [...results]

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
      Media: (data) => data.uri,
      MediaTitle: () => null
    },
    resolvers: {
      Media: {
        uri: (parent, args, cache, info) => {
          const parentUri = parent.uri
          const isScannarr = parentUri && isScannarrUri(parentUri)
          const handleUris =
            isScannarr &&
            cache.resolve(
              cache.resolve({ __typename: 'Media', uri: parent.uri }, 'handles'),
              'edges'
            )
            ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'uri'))

          return (
            isScannarr
              ? toScannarrUri(joinUris(handleUris))
              : parent.uri
          )
        },
        title: (parent, args, cache, info) => {
          const parentUri = parent.uri
          const isScannarr = parentUri && isScannarrUri(parentUri)

          if (!isScannarr) {
            return {
              __typename: 'MediaTitle',
              romanized: cache.resolve(cache.resolve({ __typename: 'Media', uri: parent.uri }, 'title'), 'romanized'),
              english: cache.resolve(cache.resolve({ __typename: 'Media', uri: parent.uri }, 'title'), 'english'),
              native: cache.resolve(cache.resolve({ __typename: 'Media', uri: parent.uri }, 'title'), 'native'),
            }
          }

          return (
            fromScannarrUri(parent.uri)
              .map(uri => {
                const titleRef = cache.resolve({ __typename: 'Media', uri }, 'title')
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
            handler: '',
            origin: '',
            id: '',
            uri: 'scannarr:',
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
          handler
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
    `, { uri: 'scannarr:bWFsOjU0MTEyLGFuaXppcDoxNzgwNixhbmlsaXN0OjE1OTgzMSxhbmltZXRvc2hvOjE3ODA2LGNyOkdKMEg3UUdRSyxhbmlkYjoxNzgwNixraXRzdTo0Njk1NCxub3RpZnltb2U6ZkpBbmZwMjRnLGxpdmVjaGFydDoxMTc2Nyx0dmRiOjQyOTMxMA==' })
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
