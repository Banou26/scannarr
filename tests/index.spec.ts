import { test } from '@japa/runner'
import { gql, ApolloClient, InMemoryCache } from "@apollo/client/core"

import { makeServer } from '../src'

test.group('Apollo client link to server instance', (group) => {
  let server: Awaited<ReturnType<typeof makeServer>>
  let client: ApolloClient<any>

  group.setup(async () => {
    server = await makeServer({
      operationPrefix: 'Test',
      resolvers: [{
        Page: {
          media: () => [({ id: '1' })]
        },
        Media: () => ({ id: '1' }),
        Query: {
          Media: () => ({ id: '1' })
        }
      }]
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
          Media {
            id
          }
          Page {
            media {
              id
            }
          }
        }
      `
      })
    expect(data).toEqual({
      Media: {
        __typename: 'Media',
        id: '1'
      },
      Page: {
        __typename: 'Page',
        media: [{ __typename: 'Media', id: '1' }]
      }
    })
  })
})
