import { Resolvers } from 'src/generated/graphql'

import MediaResolvers from './media'

export default {
  ...MediaResolvers,
  Query: {
    ...MediaResolvers.Query
  }
} satisfies Resolvers
