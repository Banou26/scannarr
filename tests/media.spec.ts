import { test } from '@japa/runner'
import { gql } from "@apollo/client/core"

import { setupApollo } from './utils'

const QUERY_MEDIA = gql`
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

const makeMedia = (id: string) => ({
  handler: 'handler',
  origin: 'origin',
  id,
  uri: `handler:origin:${id}`,
  handles: []
})

const makeMediaResponse = (id: string) => ({
  __typename: 'Media',
  ...makeMedia(id)
})

test.group('Media resolvers', (group) => {
  test('returns single query resolver\'s response', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [
        {
          Query: {
            Media: () => makeMedia('1')
          }
        }
      ]
    })
    const { data } = await client.query({
      query: QUERY_MEDIA
    })
    expect(data).toEqual({
      Media: makeMediaResponse('1')
    })
  })
  test('returns first single response from multiple query resolvers', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [
        {
          Query: {
            Media: () => makeMedia('1')
          }
        },
        {
          Query: {
            Media: () => makeMedia('2')
          }
        }
      ]
    })
    const { data } = await client.query({
      query: QUERY_MEDIA
    })
    expect(data).toEqual({
      Media: makeMediaResponse('1')
    })
  })
  test('returns single filtered response from multiple query resolvers', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [
        {
          Query: {
            Media: (_, args) =>
              args.id === '1'
                ? makeMedia('1')
                : null
          }
        },
        {
          Query: {
            Media: (_, args) =>
              args.id === '2'
                ? makeMedia('2')
                : null
          }
        }
      ]
    })
    expect(
      (await client.query({
        query: QUERY_MEDIA,
        variables: {
          id: '1'
        }
      })).data
    ).toEqual({
      Media: makeMediaResponse('1')
    })
    expect(
      (await client.query({
        query: QUERY_MEDIA,
        variables: {
          id: '2'
        }
      })).data
    ).toEqual({
      Media: makeMediaResponse('2')
    })
  })
})
