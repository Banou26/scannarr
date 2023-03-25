import { test } from '@japa/runner'
import { gql, ApolloClient, InMemoryCache } from "@apollo/client/core"

import { makeServer } from '../src'
import { setupApollo } from './utils'

test.group('Media resolvers', (group) => {
  test('returns single query resolver\'s response', async ({ expect, cleanup }) => {
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
  test('returns first single response from multiple query resolvers', async ({ expect, cleanup }) => {
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
        },
        {
          Query: {
            Media: () => ({
              handler: 'handler',
              origin: 'origin',
              id: '2',
              uri: 'handler:origin:2',
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
