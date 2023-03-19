import { test } from '@japa/runner'
import * as _ApolloClient from '@apollo/client'

import * as Scannarr from '../build'

const { ApolloClient, gql, InMemoryCache } = _ApolloClient
const { makeServer } = Scannarr

test.group('Apollo client link to server instance', (group) => {
  let server: ReturnType<typeof makeServer>
  let client: _ApolloClient.ApolloClient<any>

  group.setup(async () => {
    server = makeServer({ operationPrefix: 'Test' })
    client = new ApolloClient({
      cache: new InMemoryCache(),
      link: server.link
    })

    return () => {
      server.server.stop()
    }
  })

  test('link', async ({ expect }) => {
    const res = await client.query({
      query: gql`
        query {
          TestMedia {
            id
          }
        }
      `
    })
    console.log('res', res)
  })
})
