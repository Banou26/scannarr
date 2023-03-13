import { ApolloServer } from '@apollo/server'

import typeDefs from './schema'

const resolvers = {
  Query: {
    books: () => {}
  }
}

export const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.start()

export default server
