import type { Media, Resolvers } from '../generated/graphql'

export default {
  Media: {
    
  },
  Query: {
    media: () => {

      return undefined as unknown as Media
    }
  }
} satisfies Resolvers
