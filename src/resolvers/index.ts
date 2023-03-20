import { Resolvers } from '../generated/graphql'

import MediaResolvers from './media'
import PageResolvers from './page'

export default {
  ...MediaResolvers,
  ...PageResolvers,
  Query: {
    ...MediaResolvers.Query,
    ...PageResolvers.Query
  }
} satisfies Resolvers
