

import type { Page, Resolvers } from '../generated/graphql'

export default () => ({
  Page: {
    media: () => [({ id: '1' })]
  },
  Query: {
    Page: () => ({
      pageInfo: {
        currentPage: 1,
        hasNextPage: false,
        lastPage: 1,
        perPage: 1,
        total: 1
      },
      media: [({ id: '1' })]
    })
    // media: () => [({ id: '1' })]
  }
}) satisfies Resolvers
