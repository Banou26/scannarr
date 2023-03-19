import { test } from '@japa/runner'
import { gql, ApolloClient, InMemoryCache } from "@apollo/client/core/core.cjs"

import { makeServer } from '../build'

test.group('Apollo client link to server instance', (group) => {
  let server: Awaited<ReturnType<typeof makeServer>>
  let client: ApolloClient<any>

  group.setup(async () => {
    server = await makeServer({
      operationPrefix: 'Test'
    })
    client = new ApolloClient({
      cache: new InMemoryCache(),
      link: server.link
    })

    return async () => {
      await server.server.stop()
    }
  })

  test('link', async ({ expect }) => {
    const { data } = await client.query({
      query: gql`
        query Test {
          media {
            id
          }
        }
      `
      })
    expect(data).toEqual({ media: { id: '1' } })
  })
})
