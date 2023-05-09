import type { BaseContext as ApolloBaseContext, ContextThunk } from '@apollo/server'
import { Handle, HandleRelation, MediaTrailer, Resolvers } from './generated/graphql'
import { split } from '@apollo/client/link/core'
import { HttpLink } from '@apollo/client/link/http'
import { getMainDefinition } from '@apollo/client/utilities'
import { ApolloServer } from '@apollo/server'
import { onError } from '@apollo/client/link/error'
import deepmerge from 'deepmerge'
import { Sorts } from './sorts'

import schema from './graphql'

import { ApolloClient, FieldFunctionOptions, InMemoryCache, Reference, gql } from '@apollo/client/core'
import { Uris, fromScannarrUri, fromUri, isUri, populateUri, toScannarrId, toScannarrUri } from './utils'
import { makeLink } from './link'
import { groupBy } from './utils/groupBy'

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
  resolversList?: Resolvers[]
  operationPrefix?: string
  silenceResolverErrors?: boolean
  context: ContextThunk<Context>,
  originPriority?: string[]
}

const sortHandles = (priorityList: string[], handles: Handle[], getHandle: (value: any) => Handle) =>
  [...handles]
    .sort((a, b) => {
      const aPriority = priorityList.indexOf(getHandle(a)?.origin)
      const bPriority = priorityList.indexOf(getHandle(b)?.origin)
      if (aPriority === -1 && bPriority === -1) return 0
      if (aPriority === -1) return 1
      if (bPriority === -1) return -1
      return aPriority - bPriority
    })


export default <Context extends BaseContext, T extends MakeServerOptions<Context>>({ operationPrefix, typeDefs, resolversList, silenceResolverErrors, context, originPriority = [] }: T) => {
  
  const getHandlesField = <T>(fieldName: string, defaultValue?: T) =>
    (existing: any, { readField }: FieldFunctionOptions<Record<string, any>, Record<string, any>>) =>
      (
        fromUri(readField('uri')).origin === 'scannarr'
        ? (
          readField('handles')?.edges?.[0]?.node
            ? readField(fieldName, readField('handles')?.edges?.[0]?.node)
            : (existing ?? null)
        ) ?? existing
        : existing
      )
      ?? defaultValue

  const deepMergeHandlesFields = <T>(fieldName: string, defaultValue?: T) =>
    (existing: any, { readField }: FieldFunctionOptions<Record<string, any>, Record<string, any>>) =>
      (
        fromUri(readField('uri')).origin === 'scannarr'
          ? (
            sortHandles(
              originPriority,
              readField('handles')?.edges ?? [],
              (value: any) =>
                fromUri(
                  JSON.parse(
                    inMemoryCache
                      .identify(readField('node', value))
                      .split(':')
                      .slice(1)
                      .join(':')
                  )
                  .uri
                )
            )
            ?.reduce((acc: any, edge: any) => {
              const field = readField(fieldName, edge.node)
              if (acc === undefined || acc === null) return field
              return field ? deepmerge(acc, field) : acc
            }, existing)
          ) ?? existing
          : existing
      )
      ?? defaultValue

    const deepMergeUniqueHandlesFields = <T>(fieldName: string, keyGetter: (item: Reference) => string, defaultValue?: T) =>
      (existing: any, { readField }: FieldFunctionOptions<Record<string, any>, Record<string, any>>) =>
      fromUri(readField('uri')).origin === 'scannarr'
        ? (
          sortHandles(
            originPriority,
            readField('handles')?.edges ?? [],
            (value: any) =>
              fromUri(
                JSON.parse(
                  inMemoryCache
                    .identify(readField('node', value))
                    .split(':')
                    .slice(1)
                    .join(':')
                )
                .uri
              )
          ).flatMap(edge => readField(fieldName, edge.node))
        )
        : existing ?? defaultValue

  const inMemoryCache = new InMemoryCache({
    addTypename: false,
    typePolicies: {
      MediaConnection: {
        fields: {
          edges: (existing) =>
            existing
            ?? [],
          nodes: (existing, { readField }: FieldFunctionOptions<Record<string, any>, Record<string, any>>) =>
            readField('edges')
              ?.map((edge: any) => edge.node)
            ?? existing
            ?? []
        }
      },
      Page: {
        fields: {
          media: {
            keyArgs: false,
            read: (existing, { args, ...rest}: FieldFunctionOptions<Record<string, any>, Record<string, any>>) => {
              const { sort } = args as { sort: (keyof typeof Sorts)[] }
              const sorts = sort?.map((sort) => Sorts[sort])
    
              const sortBy = (results: any[], sort: (a, b, params: FieldFunctionOptions<Record<string, any>, Record<string, any>>) => number, sortRest: ((a, b) => number)[]) => {
                const sorted = results.sort((a, b) => sort(a, b, { args, ...rest }))
                if (sortRest.length) return sortBy(sorted, sortRest[0]!, sortRest.slice(1))
                return sorted
              }

              const sortedResults =
                sorts
                  ? sortBy([...existing], sorts[0]!, sorts.slice(1))
                  : existing

              return sortedResults
            },
            merge: (existing, incoming) => [
              ...(existing?.filter(item => !incoming.some(_item => _item.uri === item.uri)) ?? []),
              ...(incoming.map(item => {
                const _item = existing?.find(_item => _item.uri === item.uri)
                return _item ? deepmerge(_item, item) : item
              }) ?? [])
            ]
          }
        }
      },
      Media: {
        keyFields: ['uri'],
        fields: {
          description: getHandlesField('description', null),
          popularity: (existing, { readField }: FieldFunctionOptions<Record<string, any>, Record<string, any>>) =>
            fromUri(readField('uri')).origin === 'scannarr'
              ? (
                readField('handles')
                  ?.edges
                  ?.reduce((acc: number, edge: any) => Math.max(acc, readField('popularity', edge.node)), 0)
              ) ?? existing
              : existing,
          shortDescription: getHandlesField('shortDescription', null),
          coverImage: deepMergeHandlesFields('coverImage', []),
          bannerImage: deepMergeHandlesFields('bannerImage', []),
          episodes: deepMergeHandlesFields('episodes', { edges: [] }),
          title: deepMergeHandlesFields('title', { romanized: null, native: null, english: null }),
          trailers: deepMergeUniqueHandlesFields('trailers', mediaTrailer => mediaTrailer.__ref, []),
          handles: {
            merge: (existing, incoming) => {
              const edges = [
                ...(existing?.edges?.filter(item => !incoming?.edges?.some(_item => _item.node.uri === item.node.uri)) ?? []),
                ...(incoming?.edges?.map(item => {
                  const _item = existing?.edges?.find(_item => _item.node.uri === item.node.uri)
                  return _item ? deepmerge(_item, item) : item
                }) ?? [])
              ]
              return {
                ...existing,
                edges,
                nodes: edges.map((edge: any) => edge.node)
              }
            }
          }
        }
      },
      MediaTitle: {
        merge: (existing, incoming) => ({ ...existing, ...incoming })
      },
      MediaEpisodeConnection: {
        fields: {
          // todo: this needs refactor
          edges: (existing) =>
            [...groupBy(existing, (edge) => edge.node.number).entries()]
              .map(([number, edges]) =>
                edges.reduce((acc, edge) => ({
                  node: {
                    ...deepmerge(acc.node ?? {}, edge.node) as any,
                    media: {
                      ...populateUri({
                        id: toScannarrId([...new Set(existing.map(edge => edge.node.mediaUri))].join(',') as Uris),
                        origin: 'scannarr'
                      }),
                      url: null
                    },
                    mediaUri: toScannarrUri([...new Set(existing.map(edge => edge.node.mediaUri))].join(',') as Uris),
                    uri: `${toScannarrUri([...new Set(existing.map(edge => edge.node.mediaUri))].join(',') as Uris)}-${edge.node.number}`,
                  },
                  uri: toScannarrUri([...new Set(existing.map(edge => edge.node.mediaUri))].join(',') as Uris),
                }), {})
              )
        }
      }
    }
  })

  const defaultResolvers = (resolvers: Resolvers) => ({
    ...resolvers,
    MediaCoverImage: {
      default: (mediaCoverImage) =>
        mediaCoverImage.extraLarge
        ?? mediaCoverImage.large
        ?? mediaCoverImage.medium
        ?? mediaCoverImage.small,
      ...resolvers.MediaCoverImage
    },
    MediaConnection: {
      nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge.node) ?? [],
      ...resolvers.MediaConnection
    },
    MediaEpisodeConnection: {
      nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge?.node) ?? [],
      ...resolvers.MediaEpisodeConnection
    }
  })

  const resolversClients =
    resolversList?.map(resolvers => {
      const server = new ApolloServer<Context>({
        typeDefs:
          typeDefs
            ? `${schema}\n\n${typeDefs}`
            : schema,
        resolvers: defaultResolvers(resolvers),
        includeStacktraceInErrorResponses: true
      })

      server.start()
    
      const link = makeLink({
        prefix: operationPrefix,
        server,
        context
      })

      return new ApolloClient({
        cache: inMemoryCache,
        link,
        defaultOptions: {
          query: { fetchPolicy: 'network-only' }
        }
      })
    })
    ?? []

  const server = new ApolloServer<Context>({
    includeStacktraceInErrorResponses: true,
    typeDefs:
      typeDefs
        ? `${schema}\n\n${typeDefs}`
        : schema,
    resolvers: defaultResolvers({
      Page: {
        media: async (...params) => {
          const [_, __, { resolversResults }] = params
          const _results = resolversResults.flatMap(results => results.data.Page.media)

          const typeName = 'Media'
          let results = [...new Map(_results.map(item => [item.uri, item])).values()]
          const index: { [key: string]: string[] } = {}
          const alreadyRecursed = new Set()
      
          const addHandleRecursiveToIndex = (_handle: Handle) => {
            if (alreadyRecursed.has(_handle.uri)) return
            alreadyRecursed.add(_handle.uri)
            
            if (!results.some(handle => handle.uri === _handle.uri)) {
              results = [...results, _handle]
            }
      
            if (!index[_handle.uri]) index[_handle.uri] = [_handle.uri]
            const identicalHandles =
              _handle
                .handles
                ?.edges
                ?? []
            for (const handle of identicalHandles) {
              if (!index[handle.node.uri]) index[handle.node.uri] = [handle.node.uri]
      
              if (!index[_handle.uri]?.includes(handle.node.uri)) index[_handle.uri]?.push(handle.node.uri)
              if (!index[handle.node.uri]?.includes(handle.node.uri)) index[handle.node.uri]?.push(_handle.uri)
              for (const uri of index[_handle.uri] ?? []) {
                if (!index[uri]?.includes(handle.node.uri)) index[uri]?.push(handle.node.uri)
              }
              for (const uri of index[handle.node.uri] ?? []) {
                if (!index[uri]?.includes(_handle.uri)) index[uri]?.push(_handle.uri)
              }
              addHandleRecursiveToIndex(handle.node)
            }
          }
      
          for (const handle of _results) {
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
    
        const handleGroups = groups.map((uris) => results.filter((handle) => uris.includes(handle.uri)))
        const scannarrHandles =
          handleGroups
            .map((handles) => populateUri({
              __typename: typeName,
              origin: 'scannarr',
              id: toScannarrId(handles.map(handle => handle.uri).join(',') as Uris),
              handles: {
                __typename: `${typeName}Connection`,
                edges: handles.map((handle) => ({
                  __typename: `${typeName}Edge`,
                  handleRelationType: HandleRelation.Identical,
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
        
          return scannarrHandles
        }
      },
      Query: {
        Page: () => ({}),
        Media: async (...args) => {
          const [_, { uri, id = fromUri(uri).id, origin: _origin = fromUri(uri).origin }, { resolversResults }] = args
          const uris = fromScannarrUri(uri)
          const edges =
            uris.map(uri => ({
              node: {
                ...populateUri({
                  id: fromUri(uri).id,
                  origin: fromUri(uri).origin,
                  handles: {
                    nodes: [],
                    edges: []
                  }
                }),
                ...resolversResults?.find(result => result?.data?.Media?.uri === uri)?.data?.Media
              }
            }))

          return {
            ...deepmerge.all(edges.map(edge => edge?.node)),
            ...populateUri({
              origin: _origin,
              id: id!,
              handles: {
                edges,
                nodes: edges?.map(edge => edge?.node) ?? []
              }
            })
          }
        }
      }
    })
  })

  const clientLink = makeLink({
    prefix: operationPrefix,
    server,
    context
  })

  const client = new ApolloClient({
    cache: inMemoryCache,
    // typeDefs,
    link: clientLink
  })

  const fetch: (input: RequestInfo | URL, init: RequestInit) => Promise<Response> = async (input, init) => {
    const body = JSON.parse(init.body!.toString())
    const headers = new Map<string, string>()
    for (const [key, value] of Object.entries(init.headers!)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const rootUri = body.variables.uri
    const uris =
      rootUri && isUri(rootUri) && rootUri.startsWith('scannarr:')
        ? fromScannarrUri(rootUri)
        : undefined

    const resolversResults =
      await Promise.all(
        (await Promise.allSettled(
          (uris ?? [undefined])
            .flatMap(uri =>
              resolversClients?.map(client =>
                client
                  .query({
                    query: gql(body.query),
                    variables:
                      uri
                        ? ({
                          ...body.variables,
                          uri,
                          id: fromUri(uri).id,
                          origin: fromUri(uri).origin
                        })
                        : body.variables
                  })
                  .catch(err => {
                    // if (!silenceResolverErrors) console.error(err)
                    throw err
                  })
              )
            )
        ))
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => (result as PromiseFulfilledResult<any>).value)
          .filter((result) =>
            result !== undefined
            && result !== null
            && Object.values(result.data).some((value) => value !== undefined && value !== null)
          )
      )

    const res = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        body,
        // @ts-expect-error
        headers,
        method: init.method!,
        search: ''
      },
      context: async () => ({ ...await context?.(), input, init, body, headers, method: init.method!, resolversResults })
    })

    if (JSON.parse(res.body.string).errors) {
      throw JSON.parse(res.body.string).errors
    }

    client.writeQuery({
      query: gql(body.query),
      variables: body.variables,
      data: JSON.parse(res.body.string).data
    })

    const res2 = JSON.stringify(
      await client.query({
        query: gql(body.query),
        variables: body.variables,
        fetchPolicy: 'cache-only'
      })
    )

    // @ts-expect-error
    return new Response(res2, { headers: res2.headers })
  }

  const link = 
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        )
      }
      if (networkError) console.error(networkError)
    }).concat(
      split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return !operationPrefix || Boolean(definition.name?.value.startsWith(operationPrefix))
        },
        new HttpLink({ fetch })
      )
    )

  return {
    server,
    link
  }
}
