import { test } from '@japa/runner'

import { makeMedia, makeMediaResponse, QUERY_MEDIA_PAGE, setupApollo } from './utils'

test.group('Page resolvers', () => {
  test('returns response of all corresponding resolvers', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [{
        Page: {
          media: () => [makeMedia('1')]
        },
      }, {
        Page: {
          media: () => [makeMedia('2'), makeMedia('3')]
        }
      }]
    })
    const { data } = await client.query({ query: QUERY_MEDIA_PAGE })
    expect(data).toEqual({
      Page: {
        __typename: 'Page',
        media: [
          makeMediaResponse('1'),
          makeMediaResponse('2'),
          makeMediaResponse('3')
        ]
      }
    })
  })
  test('returns responses of filtered resolvers', async ({ expect, cleanup }) => {
    const { client } = await setupApollo({
      cleanup,
      resolvers: [{
        Page: {
          media: (_, args) => args.id === '1' ? [makeMedia('1')] : null
        },
      }, {
        Page: {
          media: (_, args) =>  args.id === '2' ? [makeMedia('2'), makeMedia('3')] : null
        }
      }]
    })
    const { data } = await client.query({ query: QUERY_MEDIA_PAGE, variables: { id: '2' } })
    expect(data).toEqual({
      Page: {
        __typename: 'Page',
        media: [
          makeMediaResponse('2'),
          makeMediaResponse('3')
        ]
      }
    })
  })
})
