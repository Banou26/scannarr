import { test } from '@japa/runner'
import { gql } from "@apollo/client/core"

import { setupApollo } from './utils'

test.group('Page resolvers', (group) => {
  test('returns response of all corresponding resolvers', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [{
        Page: {
          media: () => [({
            handler: 'handler',
            origin: 'origin',
            id: '1',
            uri: 'handler:origin:1',
            handles: []
          })]
        },
      }, {
        Page: {
          media: () => [({
            handler: 'handler',
            origin: 'origin',
            id: '2',
            uri: 'handler:origin:2',
            handles: []
          }), ({
            handler: 'handler',
            origin: 'origin',
            id: '3',
            uri: 'handler:origin:3',
            handles: []
          })]
        }
      }]
    })
    const { data } = await client.query({
      query: gql`
        query Test {
          Page {
            media {
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
      })
    expect(data).toEqual({
      Page: {
        __typename: 'Page',
        media: [
          {
            __typename: 'Media',
            handler: 'handler',
            origin: 'origin',
            id: '1',
            uri: 'handler:origin:1',
            handles: []
          },
          {
            __typename: 'Media',
            handler: 'handler',
            origin: 'origin',
            id: '2',
            uri: 'handler:origin:2',
            handles: []
          },
          {
            __typename: 'Media',
            handler: 'handler',
            origin: 'origin',
            id: '3',
            uri: 'handler:origin:3',
            handles: []
          }
        ]
      }
    })
  })
})
