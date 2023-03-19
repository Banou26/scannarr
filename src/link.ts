import type { ApolloServer } from '@apollo/server'

import { split } from '@apollo/client'
import { HttpLink } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'

export const makeLink = ({ prefix, server }: { prefix: string, server: ApolloServer }) => {
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
      context: async () => ({ input, init })
    })
    // @ts-expect-error
    return new Response(res.body.string, { headers: res.headers })
  }

  return split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return Boolean(definition.name?.value.startsWith(prefix))
    },
    new HttpLink({ fetch })
  )
}
