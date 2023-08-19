import type { BaseContext as ApolloBaseContext, ContextThunk } from '@apollo/server'
import type { ApolloQueryResult } from '@apollo/client/core'

import type { Origin, Resolvers } from './generated/graphql'

import { split } from '@apollo/client/link/core'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'
import { HttpLink } from '@apollo/client/link/http'
import { getMainDefinition } from '@apollo/client/utilities'
import { ApolloServer } from '@apollo/server'
import { onError } from '@apollo/client/link/error'

import { fromScannarrUri, fromUri, isUri } from './utils'
import { makeLink } from './link'

export type BaseContext = ApolloBaseContext & {
  fetch: typeof fetch
  input: RequestInfo | URL
  init?: RequestInit
  originResults: ApolloQueryResult<any> & {
    origin: OriginWithResolvers
  }[]
  server: ApolloServer<BaseContext>
  client: ApolloClient<any>
}

export {
  BaseContext as Context
}

export type OriginWithResolvers = Origin & {
  resolvers: Resolvers
}

export type MakeServerOptions<Context extends ApolloBaseContext> = {
  cache: InMemoryCache
  typeDefs: string
  origins: OriginWithResolvers[]
  operationPrefix?: string
  silenceResolverErrors?: boolean
  // context: ContextThunk<Context>
  context: ContextThunk<any>
  originPriority?: string[]
  resolvers: Resolvers
}

export default <Context extends BaseContext, T extends MakeServerOptions<Context>>({ cache, operationPrefix, typeDefs, origins, silenceResolverErrors, context, resolvers }: T) => {
  const resolversClients =
    origins?.map(origin => {
      const resolverServer = new ApolloServer<Context>({
        typeDefs,
        resolvers: origin.resolvers,
        includeStacktraceInErrorResponses: true
      })

      resolverServer.start()
    
      const link = makeLink({
        prefix: operationPrefix,
        server: resolverServer,
        context: async () => ({ ...await context?.(), server, client: finalClient })
      })

      return {
        client: new ApolloClient({
          cache,
          link,
          defaultOptions: {
            query: { fetchPolicy: 'network-only' }
          }
        }),
        origin
      }
    })
    ?? []

  const server = new ApolloServer<Context>({
    includeStacktraceInErrorResponses: true,
    typeDefs,
    resolvers
  })

  server.start()

  const clientLink = makeLink({
    prefix: operationPrefix,
    server,
    context
  })

  const client = new ApolloClient({
    cache,
    typeDefs,
    link: clientLink
  })

  const fetch: (input: RequestInfo | URL, init: RequestInit) => Promise<Response> = async (input, init) => {
    const body = JSON.parse(init.body!.toString())
    const headers = new Map<string, string>()
    for (const [key, value] of Object.entries(init.headers!)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const rootUri = body.variables.uri
    const uris =
      rootUri && isUri(rootUri) && rootUri.startsWith('scannarr:')
        ? fromScannarrUri(rootUri)
        : undefined

    const originResults =
      await Promise.all(
        (await Promise.allSettled(
          (uris ?? [undefined])
            .flatMap(uri =>
              resolversClients
                // may need to change this once i have more resolvers for non scannarr origins
                ?.filter(({ origin }) => uri ? origin.supportedUris?.includes(fromUri(uri).origin) : true)
                ?.map(({ origin, client }) =>
                  client
                    .query({
                      query: gql(body.query),
                      variables:
                        uri
                          ? ({
                            ...body.variables,
                            uri,
                            handler: fromUri(uri).handler,
                            id: fromUri(uri).id,
                            origin: fromUri(uri).origin
                          })
                          : body.variables
                    })
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

    const res = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        body,
        // @ts-expect-error
        headers,
        method: init.method!,
        search: ''
      },
      context: async () => {
        const ctx = await (async () => context?.())().catch(err => {
          if (!silenceResolverErrors) console.error(err)
          return {}
        })
        return ({
          ...ctx,
          input,
          init,
          body,
          headers,
          method: init.method!,
          // resolversResults
          originResults
        })
      }
    })

    const responseBody = JSON.parse((res.body as { string: string }).string)

    if (responseBody.errors) {
      throw responseBody.errors
    }

    client.writeQuery({
      query: gql(body.query),
      variables: body.variables,
      data: responseBody.data
    })

    const stringResponse = JSON.stringify(
      await client.query({
        query: gql(body.query),
        variables: body.variables,
        fetchPolicy: 'cache-only'
      })
    )

    // return new Response(stringResponse, { headers: res2.headers })
    return new Response(stringResponse)
  }

  const link = 
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        )
      }
      if (networkError) console.error(networkError)
    }).concat(
      split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return !operationPrefix || Boolean(definition.name?.value.startsWith(operationPrefix))
        },
        new HttpLink({ fetch })
      )
    )

  const finalClient = new ApolloClient({
    cache,
    typeDefs,
    link
  })

  return {
    server,
    link,
    client: finalClient
  }
}
