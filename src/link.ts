import type { ApolloServer, ContextThunk } from '@apollo/server'
import type { BaseContext as ApolloBaseContext, ContextThunk } from '@apollo/server'

import { split } from '@apollo/client/link/core'
import { HttpLink } from '@apollo/client/link/http'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'

import { BaseContext } from './apollo-aggregator'

export const makeLink = <Context extends BaseContext>(
  { prefix, server, context }:
  { prefix?: string, server: ApolloServer<Context>, context: ContextThunk<Context> }
) => {
  const fetch: (input: RequestInfo | URL, init: RequestInit) => Promise<Response> = async (input, init) => {
    const body = JSON.parse(init.body!.toString())
    const headers = new Map<string, string>()
    for (const [key, value] of Object.entries(init.headers!)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }
    const res = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        body,
        // @ts-expect-error
        headers,
        method: init.method!,
        search: ''
      },
      context: async () => ({ ...await context?.(), input, init })
    })
    // @ts-expect-error
    return new Response(res.body.string, { headers: res.headers })
  }

  return onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ extensions }) =>
        console.error(extensions.stacktrace.join('\n')))
    }
    if (networkError) console.error(networkError)
  }).concat(
    split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return !prefix || Boolean(definition.name?.value.startsWith(prefix))
      },
      new HttpLink({ fetch })
    )
  )
}
