import type { BaseContext as ApolloBaseContext, ContextThunk, GraphQLFieldResolverParams } from '@apollo/server'
import { Handle, HandleRelation, Resolvers } from './generated/graphql'
import type { GraphQLResolveInfo, FieldNode, GraphQLType } from 'graphql'

import { ApolloServer } from '@apollo/server'

import schema from './graphql'
import { makeLink } from './link'

import { Sorts } from './sorts'
import { ApolloClient, InMemoryCache, Resolver, gql } from '@apollo/client/core'
import { isNonNullType, isListType, isObjectType } from 'graphql'
import { cyrb53 } from './utils/hash'
import { populateUri } from './utils'


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

const mergeDeep = (...values: any[]) =>
  values.reduce((acc, value) => {
    // if (Array.isArray(value)) {
    //   console.log('DEEP MERGE IS ARRAY', values, acc, value)
    // }
    if (Array.isArray(value)) {
      return [...Array.isArray(acc) ? acc : [], ...value]
    }
    if (typeof acc === 'object' && typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = mergeDeep(acc[key], value[key])
        return acc
      }, { ...acc })
    }
    return value
  }, {})

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
              console.log(`${typeName} resolver`, parent, args, context, info)
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

              const addTypename = (value: any, type: GraphQLType) => {
                if (value === null || value === undefined) return null
                if (isNonNullType(type)) return addTypename(value, type.ofType)
                if (isListType(type)) return value.map((item: any) => addTypename(item, type.ofType))
                if (isObjectType(type)) {
                  return {
                    __typename: type.name,
                    ...Object.fromEntries(
                      Object
                        .entries(value)
                        .map(([key, value]) => [
                          key,
                          addTypename(value, type.getFields()[key]?.type!)
                        ])
                    )
                   }
                }
                return value
              }

              console.log('sortedResults', sortedResults)

              try {
                const previousState = client.extract(true)
                console.log('previousState', previousState)

                const index: { [key: string]: string[] } = {}
                const alreadyRecursed = new Set()

                const addHandleRecursiveToIndex = (_handle: Handle) => {
                  if (alreadyRecursed.has(_handle.uri)) return
                  alreadyRecursed.add(_handle.uri)

                  if (!index[_handle.uri]) index[_handle.uri] = [_handle.uri]
                  const identicalHandles =
                    _handle
                      .handles
                      .edges
                      .filter(handleConnection =>
                        handleConnection?.handleRelationType === HandleRelation.Identical
                      )
                  for (const handle of identicalHandles) {
                    if (!index[handle.node.uri]) index[handle.node.uri] = [handle.node.uri]

                    if (!index[_handle.uri].includes(handle.node.uri)) index[_handle.uri].push(handle.node.uri)
                    if (!index[handle.node.uri].includes(handle.node.uri)) index[handle.node.uri].push(_handle.uri)
                    for (const uri of index[_handle.uri]) {
                      if (!index[uri].includes(handle.node.uri)) index[uri].push(handle.node.uri)
                    }
                    for (const uri of index[handle.node.uri]) {
                      if (!index[uri].includes(_handle.uri)) index[uri].push(_handle.uri)
                    }
                    addHandleRecursiveToIndex(handle.node)
                  }
                }

                for (const handle of sortedResults) {
                  addHandleRecursiveToIndex(handle)
                }

                const groups =
                  [
                    ...new Set(
                      Object
                        .values(index)
                        .map((uris) => uris.sort((a, b) => a.localeCompare(b)))
                        .map((uris) => uris.join(' '))
                    )
                  ].map((uris) => uris.split(' '))

              const handleGroups = groups.map((uris) => sortedResults.filter((handle) => uris.includes(handle.uri)))

                console.log('index', index)
                console.log('groups', groups)
                console.log('handleGroups', handleGroups)

                const scannarrHandles =
                  handleGroups
                    .map((handles) => populateUri({
                      __typename: typeName,
                      origin: 'scannarr',
                      id: String(cyrb53(handles.map(handle => handle.uri).join(','))),
                      handles: {
                        __typename: `${typeName}Connection`,
                        edges: handles.map((handle) => ({
                          __typename: `${typeName}Edge`,
                          node: {
                            __typename: typeName,
                            ...handle
                          }
                        })),
                        nodes: handles.map((handle) => ({
                          __typename: typeName,
                          ...handle
                        }))
                      }
                    }))

                const newState = {
                  ...previousState,
                  ...Object.fromEntries(
                    [...scannarrHandles, ...sortedResults].map((result) => [
                      `${typeName}:{"uri":"${result.uri}"}`,
                      addTypename(result, info.returnType.ofType.ofType)
                    ])
                  ),
                  ROOT_QUERY: {
                    "__typename": "Query",
                    ...previousState.ROOT_QUERY,
                    ...Object.fromEntries(
                      [...scannarrHandles, ...sortedResults].map((result) => [
                        `${normalizedKey}({"uri":"${result.uri}"})`,
                        { __ref: `${typeName}:{"uri":"${result.uri}"}` }
                      ])
                    ),
                  }
                }
                console.log('newState', newState)

                inMemoryCache.restore(newState)

                const finalResults = [
                  ...scannarrHandles
                    .map(handle => ({
                      ...Object.fromEntries(
                        [
                          ...Object.entries(handle),
                          ...handle.handles.nodes.flatMap(handle => Object.entries(handle))
                        ]
                          .map(([key, value]) => [
                            key,
                            handle.handles.nodes
                              ? (
                                mergeDeep(
                                  value,
                                  ...handle
                                    .handles
                                    .nodes
                                    ?.map(handle => handle.node?.[key])
                                    .filter((value: any) => !!value)
                                )
                                ?? value
                              )
                              : value
                          ])
                      ),
                      ...handle
                    })),
                  // ...sortedResults
                ]

                console.log('finalResults', finalResults.map((result) => ({ uri: result.uri, ...result.handles })))
                console.log('finalResults2', finalResults)

                return finalResults

              } catch (err: any) {
                console.error(err)
                throw err
              }
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
      Page,
      MediaConnection: {
        nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge.node) ?? []
      }
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
