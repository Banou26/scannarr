import { ApolloServer, BaseContext as ApolloBaseContext } from '@apollo/server'
import { Resolvers } from './generated/graphql'

import resolvers from './resolvers'
import schema from './graphql'
import { makeLink } from './link'

export type MakeServerOptions = {
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

export default async <T extends MakeServerOptions>({ operationPrefix, typeDefs, resolvers }: T) => {
  const rootQueries = [
    ...new Map(
        resolvers
          ?.flatMap((resolver) => Object.entries(resolver))
      )
  ]

  const pageQueries = [
    ...new Map(
        resolvers
          ?.flatMap((resolver) => Object.entries(resolver))
          .filter(([key]) => key === 'Page')
          .flatMap(([key, value]) =>
            Object.entries(
              rootQueries
                .find(([_key]) => _key === key)
                ?.[1]
              ?? {}
            )
          )
      )
  ]

  const resolversObj = Object.fromEntries(
    rootQueries.map(([key, value]) => {
      const typeResolvers =
        rootQueries
          .filter(([_key]) => _key === key)

      return [
        key,
        Object.fromEntries(
          [
            ...new Map(
                typeResolvers
                  ?.flatMap(([, resolver]) => Object.entries(resolver))
              )
          ].map(([key, value]) => [
            key,
            async (parent, args, context, info) =>
              Promise.any(
                typeResolvers
                  .flatMap(([_, value]) => Object.entries(value))
                  .filter(([_key, value]) => typeof value === 'function')
                  ?.map(([, resolverFunction]) => resolverFunction(parent, args, context, info))
              )
          ])
        )
      ]
    })
  )

  const Page = Object.fromEntries(
    pageQueries
      .map(([key, value]) => {
        const pageResolvers =
          pageQueries
            .filter(([_key]) => _key === key)
            .filter(([_key, value]) => typeof value === 'function')
            .map(([, value]) => value)

        const normalizedKey = `${key[0]?.toLowerCase()}${key.slice(1)}`
        console.log(`Page resolvers`, normalizedKey, pageResolvers)

        return [
          normalizedKey,
          async (parent, args, context, info) => {
            console.log(`PAGE RESOLVER CALLED`, key)
            const results =
              await Promise.allSettled(
                pageResolvers?.map((resolverFunction) =>
                  resolverFunction(parent, args, context, info)
                )
              )

            return {
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: '',
                endCursor: ''
              },
              [normalizedKey]: results.filter((result) => result.status === 'fulfilled')
            }
          }
        ]
      })
  )

  console.log('resolvers', {
    ...resolversObj,
    Query: {
      ...resolversObj.Query,
      Page
    }
  })

  const server = new ApolloServer<Context>({
    typeDefs:
      typeDefs
        ? `${schema}\n\n${typeDefs}`
        : schema,
    resolvers: {
      ...resolversObj,
      Query: {
        ...resolversObj.Query,
        Page
      }
    }
  })

  await server.start()

  const link = makeLink({ prefix: operationPrefix, server })

  return {
    server,
    link
  }
}
