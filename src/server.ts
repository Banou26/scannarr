import { ApolloServer, BaseContext as ApolloBaseContext } from '@apollo/server'
import { Resolvers } from './generated/graphql'

import resolvers from './resolvers'
import schema from './graphql'
import { makeLink } from './link'

type MakeServerOptions = {
  typeDefs?: string
  resolvers?: Resolvers[]
  operationPrefix: string
}

type Context = ApolloBaseContext

// export type BaseContext = ApolloBaseContext & {
//   addResolvers: (resolvers: Resolvers<Context>) => void;
//   getResolvers: () => Resolvers<Context>[];
//   removeResolvers: (resolvers: Resolvers<Context>) => void;
// }

export default <T extends MakeServerOptions>({ operationPrefix, typeDefs, resolvers: resolverOptions = [] }: T) => {
  let registeredResolvers: Resolvers<Context>[] = [...resolverOptions]

  const context = {
    addResolvers: (resolvers: Resolvers<Context>) => {
      registeredResolvers = [...registeredResolvers, resolvers]
    },
    getResolvers: () => registeredResolvers,
    removeResolvers: (resolvers: Resolvers<Context>) => {
      registeredResolvers = registeredResolvers.filter((resolver) => resolver !== resolvers)
    }
  }

  const server = new ApolloServer<Context>({
    typeDefs:
      typeDefs
        ? `${schema}\n\n${typeDefs}`
        : schema,
    resolvers
  })
  server.start()

  const link = makeLink({ prefix: operationPrefix, server })

  return {
    server,
    link,
    ...context
  }
}
