import type { BaseContext as ApolloBaseContext, ContextThunk } from '@apollo/server'
import { Resolvers } from './generated/graphql'
import { split } from '@apollo/client/link/core'
import { HttpLink } from '@apollo/client/link/http'
import { getMainDefinition } from '@apollo/client/utilities'
import { ApolloServer } from '@apollo/server'
import { onError } from '@apollo/client/link/error'

import schema from './graphql'

import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'
import { fromScannarrUri, fromUri, isUri, populateUri } from './utils'
import { makeLink } from './link'

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
  context: ContextThunk<Context>
}

export default <Context extends BaseContext, T extends MakeServerOptions<Context>>({ operationPrefix, typeDefs, resolversList, silenceResolverErrors, context }: T) => {
  const inMemoryCache = new InMemoryCache({
    addTypename: false,
    typePolicies: {
      Media: {
        keyFields: ['uri'],
        fields: {
          description: (existing, { readField }) =>
            readField('handles')?.nodes?.[0]
              ? readField('description', readField('handles')?.nodes?.[0])
              : (existing ?? null),
        }
      },
      MediaTitle: {
        merge: (existing, incoming) => ({ ...existing, ...incoming })
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
    MediaAiringScheduleConnection: {
      nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge?.node) ?? [],
      ...resolvers.MediaAiringScheduleConnection
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
    typeDefs:
      typeDefs
        ? `${schema}\n\n${typeDefs}`
        : schema,
    resolvers: defaultResolvers({
      Query: {
        Media: async (...args) => {
          const [_, { uri, id = fromUri(uri).id, origin: _origin = fromUri(uri).origin }, { resolversResults }] = args
          console.log('Media query', args)
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

  const client = new ApolloClient({ cache: inMemoryCache, typeDefs, link: clientLink })

  const fetch: (input: RequestInfo | URL, init: RequestInit) => Promise<Response> = async (input, init) => {
    const body = JSON.parse(init.body!.toString())
    const headers = new Map<string, string>()
    for (const [key, value] of Object.entries(init.headers!)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const rootUri = body.variables.uri
    const uris = isUri(rootUri) && rootUri.startsWith('scannarr:') ? fromScannarrUri(rootUri) : [rootUri]

    const resolversResults =
      (await Promise.all(
        (await Promise.allSettled(
          uris.flatMap(uri =>
            resolversClients?.map(client =>
              client
                .query({
                  query: gql(body.query),
                  variables: {
                    ...body.variables,
                    uri,
                    id: fromUri(uri).id,
                    origin: fromUri(uri).origin
                  }
                })
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
      ))

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

    client.writeQuery({
      query: gql(body.query),
      variables: body.variables,
      data: JSON.parse(res.body.string).data
    })

    const res2 = JSON.stringify(await client.query({ query: gql(body.query), variables: body.variables, fetchPolicy: 'cache-only' }))

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
