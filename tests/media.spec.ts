import { test } from '@japa/runner'
import { gql, ApolloClient, InMemoryCache } from "@apollo/client/core"

import { makeServer } from '../src'
import { setupApollo } from './utils'

test.group('Media resolvers', (group) => {
  test('Query', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [
        {
          Query: {
            Media: () => ({
              handler: 'handler',
              origin: 'origin',
              id: '1',
              uri: 'handler:origin:1',
              handles: []
            })
          }
        }
      ]
    })
    const { data } = await client.query({
      query: gql`
        query {
          Media {
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
    })
    expect(data).toEqual({
      Media: {
        __typename: 'Media',
        handler: 'handler',
        origin: 'origin',
        id: '1',
        uri: 'handler:origin:1',
        handles: []
      }
    })
  })
})
