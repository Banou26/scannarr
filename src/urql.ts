import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { createYoga, createSchema, YogaServer, YogaInitialContext, YogaServerInstance } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

import { OriginWithResolvers } from './server'

import { typeDefs } from './generated/schema/typeDefs.generated'
import { resolvers } from './generated/schema/resolvers.generated'

import { targets as origins } from '../../laserr/src/index'
import { fromScannarrUri, fromUri, isUri } from './utils'

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
    },
    resolvers: {
    }
  })

  const schema = createSchema({
    typeDefs,
    resolvers: {
      Query: {
        Media: async (parent, args, ctx, info) => {
          const results = await getOriginResults({ ctx, origins, context })

          console.log('results', results)
          return null
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
    exchanges: [cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) =>
      yoga.handleRequest(new Request(input, init), {})
  })

  console.log('boop')
  const res = await client
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
            edges {
              node {
                ...GetMediaTestFragment
              }
            }
          }
        }
      }
  `, { uri: 'scannarr:bWFsOjU0MTEyLGFuaXppcDoxNzgwNixhbmlsaXN0OjE1OTgzMSxhbmltZXRvc2hvOjE3ODA2LGNyOkdKMEg3UUdRSyxhbmlkYjoxNzgwNixraXRzdTo0Njk1NCxub3RpZnltb2U6ZkpBbmZwMjRnLGxpdmVjaGFydDoxMTc2Nyx0dmRiOjQyOTMxMA==' })
    .toPromise()

  console.log('res', res)

}

makeScannarr({
  origins,
  context: async () => ({
    fetch
  })
})

export default makeScannarr
