import type { TestHooksCleanupHandler, TestContext } from '@japa/core'
import type { MakeServerOptions } from '../src/server'

import { ApolloClient, gql, InMemoryCache } from '@apollo/client/core'

import { makeServer } from '../src'

export const setupApollo = async (
  { cleanup, ...rest }: MakeServerOptions & { cleanup: (handler: TestHooksCleanupHandler<TestContext>) => void }
) => {
  const { server, link } = makeServer(rest)
  cleanup(() => server.stop())
  await server.start()
  const client = new ApolloClient({ cache: new InMemoryCache(), link })
  return {
    client,
    server,
    link
  }
}

export const QUERY_MEDIA = gql`
  query ($id: String) {
    Media(id: $id) {
      id
      uri
      handler
      origin
      handles {
        __typename
      }
    }
  }
`

export const QUERY_MEDIA_PAGE = gql`
  query ($id: String) {
    Page {
      media(id: $id) {
        id
        uri
        handler
        origin
        handles {
          __typename
        }
      }
    }
  }
`

export const makeMedia = (id: string) => ({
  handler: 'handler',
  origin: 'origin',
  id,
  uri: `handler:origin:${id}`,
  handles: []
})

export const makeMediaResponse = (id: string) => ({
  __typename: 'Media',
  ...makeMedia(id)
})

