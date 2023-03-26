import type { BaseContext as ApolloBaseContext } from '@apollo/server'
import type { Resolvers } from './generated/graphql'

import { ApolloServer } from '@apollo/server'

import schema from './graphql'
import { makeLink } from './link'


export type MakeServerOptions = {
  typeDefs?: string
  resolvers?: Resolvers[]
  operationPrefix?: string
}

type Context = ApolloBaseContext

export default <T extends MakeServerOptions>({ operationPrefix, typeDefs, resolvers }: T) => {
  const rootQueries = [
    ...new Map(
        resolvers
          ?.flatMap((resolver) => Object.entries(resolver))
      )
  ]

  const allPageQueries =
    resolvers
      ?.flatMap((resolver) => Object.entries(resolver))
      .filter(([key]) => key === 'Page')
      .flatMap(([key, value]) => Object.entries(value))
      ?? []

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
    rootQueries.map(([key]) => {
      const typeResolvers =
        (resolvers ?? [])
          ?.flatMap((resolver) => Object.entries(resolver))
          .filter(([_key]) => _key === key)

      return [
        key,
        Object.fromEntries(
          [
            ...new Map(
                typeResolvers
                  ?.flatMap(([, resolver]) => Object.entries(resolver))
              )
          ].map(([key]) => [
            key,
            (parent, args, context, info) =>
              Promise.any(
                typeResolvers
                  .flatMap(([_, value]) => Object.entries(value))
                  .filter(([_key, value]) => typeof value === 'function')
                  .map(async ([, resolverFunction]) => resolverFunction(parent, args, context, info))
                  .map(async result =>
                    (await result) === undefined || (await result) === null
                      ? Promise.reject()
                      : result
                  )
              )
          ])
        )
      ]
    })
  )

  const Page =
    Object.fromEntries(
      pageQueries
        .map(([key]) => {
          const pageResolvers =
            allPageQueries
              .filter(([_key]) => _key === key)
              .filter(([_key, value]) => typeof value === 'function')
              .map(([, value]) => value)

          const normalizedKey = `${key[0]?.toLowerCase()}${key.slice(1)}`

          return [
            normalizedKey,
            async (parent, args, context, info) => {
              const results =
                (await Promise.allSettled(
                  pageResolvers?.map((resolverFunction) =>
                    resolverFunction(parent, args, context, info)
                  )
                ))
                  .filter((result) => result.status === 'fulfilled')
                  .flatMap((result) => (result as PromiseFulfilledResult<any>).value)
                  .filter((result) => result !== undefined && result !== null)
              return results
            }
          ]
        })
    )

  const server = new ApolloServer<Context>({
    typeDefs:
      typeDefs
        ? `${schema}\n\n${typeDefs}`
        : schema,
    resolvers: {
      ...resolversObj,
      Query: {
        ...resolversObj.Query,
        Page: () => Page
      },
      Page
    }
  })

  const link = makeLink({ prefix: operationPrefix, server })

  return {
    server,
    link
  }
}
