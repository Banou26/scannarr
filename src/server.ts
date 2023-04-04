import type { BaseContext as ApolloBaseContext, ContextThunk } from '@apollo/server'
import type { Resolvers } from './generated/graphql'

import { ApolloServer } from '@apollo/server'

import schema from './graphql'
import { makeLink } from './link'

import { Sorts } from './sorts'
import { InMemoryCache } from '@apollo/client/core'

export type BaseContext = ApolloBaseContext & {
  fetch: typeof fetch
  input: RequestInfo | URL
  init?: RequestInit
}

export {
  BaseContext as Context
}

export type MakeServerOptions<Context extends ApolloBaseContext> = {
  typeDefs?: string
  resolvers?: Resolvers[]
  operationPrefix?: string
  silenceResolverErrors?: boolean
  context: ContextThunk<Context>
}

export default <Context extends BaseContext, T extends MakeServerOptions<Context>>({ operationPrefix, typeDefs, resolvers, silenceResolverErrors, context }: T) => {
  const inMemoryCache = new InMemoryCache()
  
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
                  .map(async ([, resolverFunction]) =>
                    resolverFunction(parent, args, context, info)
                      .catch(err => {
                        if (!silenceResolverErrors) console.error(err)
                        throw err
                      })
                  )
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
              const { sort } = args as { sort: (keyof typeof Sorts)[] }
              const results =
                (await Promise.allSettled(
                  pageResolvers?.map((resolverFunction) =>
                    resolverFunction(parent, args, context, info)
                      .catch(err => {
                        if (!silenceResolverErrors) console.error(err)
                        throw err
                      })
                  )
                ))
                  .filter((result) => result.status === 'fulfilled')
                  .flatMap((result) => (result as PromiseFulfilledResult<any>).value)
                  .filter((result) => result !== undefined && result !== null)

              const sorts = sort?.map((sort) => Sorts[sort])

              const sortBy = (results: any[], sort: (a, b) => number, sortRest: ((a, b) => number)[]) => {
                const sorted = results.sort(sort)
                if (sortRest.length) return sortBy(sorted, sortRest[0]!, sortRest.slice(1))
                return sorted
              }

              const sortedResults =
                sorts
                  ? sortBy(results, sorts[0]!, sorts.slice(1))
                  : results
              
              for (const result of sortedResults) {
                inMemoryCache.modify({
                  id: inMemoryCache.identify({ __ref: `${normalizedKey}:${result.uri}`, __typename: normalizedKey }),
                  fields:
                    Object.fromEntries(
                      Object
                        .entries(result)
                        .map(([key, value]) => [key, () => value])
                    )
                })

                // impl a "scannarr" source that takes data from all related items
              }

              return sortedResults
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

  const link = makeLink({
    prefix: operationPrefix,
    server,
    context
  })

  return {
    server,
    link
  }
}
