import { test } from '@japa/runner'
import { gql } from "@apollo/client/core"

import { setupApollo } from './utils'

test.group('Page resolvers', (group) => {
  test('returns ', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [{
        Page: {
          media: () => [{ id: '1' }]
        },
      }, {
        Page: {
          media: () => [{ id: '2' }, { id: '3' }]
        }
      }]
    })
    const { data } = await client.query({
      query: gql`
        query Test {
          Page {
            media {
              id
            }
          }
        }
      `
      })
    expect(data).toEqual({
      Page: {
        __typename: 'Page',
        media: [
          { __typename: 'Media', id: '1' },
          { __typename: 'Media', id: '2' },
          { __typename: 'Media', id: '3' }
        ]
      }
    })
  })
})
