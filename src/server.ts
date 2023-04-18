import type { BaseContext as ApolloBaseContext, ContextThunk, GraphQLFieldResolverParams } from '@apollo/server'
import { Handle, HandleRelation, Resolvers } from './generated/graphql'
import type { GraphQLResolveInfo, FieldNode, GraphQLType } from 'graphql'

import { ApolloServer } from '@apollo/server'

import schema from './graphql'
import { makeLink } from './link'

import { Sorts } from './sorts'
import { ApolloClient, InMemoryCache, Resolver, gql } from '@apollo/client/core'
import { isNonNullType, isListType, isObjectType } from 'graphql'
// import { cyrb53 } from './utils/hash'
import { fromScannarrUri, fromUri, isUri, populateUri } from './utils'
import { graphify } from './utils/resolver'


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

// /**
//  * Simple object check.
//  * @param item
//  * @returns {boolean}
//  */
// export function isObject(item) {
//   return (item && typeof item === 'object' && !Array.isArray(item));
// }

// /**
//  * Deep merge two objects.
//  * @param target
//  * @param ...sources
//  */
// export function mergeDeep(target, ...sources) {
//   if (!sources.length) return target;
//   const source = sources.shift();

//   if (isObject(target) && isObject(source)) {
//     for (const key in source) {
//       if (isObject(source[key])) {
//         if (!target[key]) Object.assign(target, { [key]: {} });
//         mergeDeep(target[key], source[key]);
//       } else {
//         Object.assign(target, { [key]: source[key] });
//       }
//     }
//   }

//   return mergeDeep(target, ...sources);
// }

export default <Context extends BaseContext, T extends MakeServerOptions<Context>>({ operationPrefix, typeDefs, resolvers, silenceResolverErrors, context }: T) => {
  const inMemoryCache = new InMemoryCache({
    addTypename: false,
    typePolicies: {
      Media: {
        keyFields: ['uri']
      }
    }
  })
  const client = new ApolloClient({ cache: inMemoryCache, typeDefs })
  console.log('inMemoryCache', inMemoryCache)
  
  const rootQueries = [
    ...new Map(
        resolvers
          ?.flatMap((resolver) => Object.entries(resolver))
      )
  ]

  const allQueryQueries =
    resolvers
      ?.flatMap((resolver) => Object.entries(resolver))
      .filter(([key]) => key === 'Query')
      .flatMap(([key, value]) => Object.entries(value))
      ?? []

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
          const typeName = `${key[0]?.toUpperCase()}${key.slice(1)}`

          return [
            normalizedKey,
            async (parent, args, context, info: GraphQLResolveInfo) => {
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

              const finalResults = graphify({ results, typeName, client, normalizedKey, info })

              const sortedResults =
                sorts
                  ? sortBy(finalResults, sorts[0]!, sorts.slice(1))
                  : finalResults

              return sortedResults
            }
          ]
        })
    )

  const _resolvers: Resolvers = {
    ...resolversObj,
    Query: {
      ...resolversObj.Query,
      Media: async (...args) => {
        const [parent, params, context, info] = args

        console.log('allQueryQueries', allQueryQueries)
        const queryResolvers =
          allQueryQueries
            .filter(([_key]) => _key === 'Media')
            .filter(([_key, value]) => typeof value === 'function')
            .map(([, value]) => value)
        console.log('queryResolvers', queryResolvers)

        if (params?.uri && isUri(params.uri) && params.uri.startsWith('scannarr:')) {
          const uri = params.uri
          const uris = fromScannarrUri(uri)
          console.log('uris', uris)
          // const handle = context.handles?.find(handle => handle.uri === uri)
          const results =
            await Promise.all(
              (await Promise.allSettled(
                uris.map(uri =>
                  queryResolvers?.map((resolverFunction) =>
                    void console.log('resolverFunction', resolverFunction) ||
                    resolverFunction(parent, { uri, id: fromUri(uri).id, origin: fromUri(uri).origin }, context, info)
                      .catch(err => {
                        if (!silenceResolverErrors) console.error(err)
                        throw err
                      })
                  )  
                )
              ))
                .filter((result) => result.status === 'fulfilled')
                .flatMap((result) => (result as PromiseFulfilledResult<any>).value)
                .filter((result) => result !== undefined && result !== null)
            )
          console.log('results', results)

          const finalResults = graphify({ results, typeName: 'Media', client, normalizedKey: 'media', info })
          console.log('finalResults', finalResults)

          return finalResults[0]
        }

        return resolversObj.Query?.Media?.(...args)
      },
      Page: () => Page
    },
    Page,
    MediaCoverImage: {
      default: (mediaCoverImage) =>
        mediaCoverImage.extraLarge
        ?? mediaCoverImage.large
        ?? mediaCoverImage.medium
        ?? mediaCoverImage.small
    },
    MediaConnection: {
      nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge.node) ?? []
    }
  }

  const server = new ApolloServer<Context>({
    typeDefs:
      typeDefs
        ? `${schema}\n\n${typeDefs}`
        : schema,
    resolvers: _resolvers
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
