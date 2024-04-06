
import type { YogaServerInstance } from 'graphql-yoga'
import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import { Client, fetchExchange } from 'urql'

import typeDefs from '../graphql'

import { serverResolvers as makeMediaServerResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers } from './episode'
import { serverResolvers as makePlaybackSourceServerResolvers } from './playback-source'
import { serverResolvers as makeUserServerResolvers } from './user'
import { Episode, Handle, Media, MutationResolvers, QueryResolvers, Resolvers, SubscriptionResolvers, UserMedia } from '../generated/graphql'
import { merge } from '../utils/deep-merge'
import { makeGraphDatabase } from '../graph-database'

export type SimpleRoot = QueryResolvers & MutationResolvers
export type ResolverArgs =
  Parameters<ReturnType<Extract<SubscriptionResolvers[keyof SubscriptionResolvers], Function>>['subscribe']>[1] &
  Parameters<Extract<SimpleRoot[keyof SimpleRoot], Function>>[1]

export type ServerContext = {
  client: Client
  fetch: typeof fetch
  request: Request
  params: {
    operationName: string
    query: string
    variables: ResolverArgs
  }
}

export type UserContext = {

}

export type Origin = {
  icon: string
  originUrl: string
  categories: string[]
  name: string
  origin: string
  official: true
  metadataOnly: true
  resolvers: Resolvers
}

export type OriginCtx = {
  origin: Origin
  server: YogaServerInstance<ServerContext, {}>
  client: Client
}

export type HandleType = NodeData // Media | Episode
export type MergeHandleFunction = (handles: (HandleType)[]) => HandleType

export type ServerResolverParameters = {
  graph: InMemoryGraphDatabase
  origins: OriginCtx[]
  context?: () => Promise<ServerContext>
  mergeHandles: MergeHandleFunction
}

export const makeScannarrServer = (
  { origins: _origins, context, mergeHandles }:
  { origins: Origin[], context: () => Promise<ServerContext>, mergeHandles: MergeHandleFunction }
) => {
  const graph = makeGraphDatabase()
  console.log('graph', graph)
  const origins =
    _origins
      .map(origin => {
        const server = createYoga<ServerContext, UserContext>({
          maskedErrors: false,
          schema: createSchema({
            typeDefs,
            resolvers:
              merge(
                {
                  Media: {
                    episodes: (parent) => parent.episodes ?? []
                  },
                  Query: {
                    authentications: () => [],
                  },
                  Subscription: {
                    media: { subscribe: async function*() {} },
                    mediaPage: { subscribe: async function*() {} },
                    episode: { subscribe: async function*() {} },
                    episodePage: { subscribe: async function*() {} },
                    playbackSource: { subscribe: async function*() {} },
                    playbackSourcePage: { subscribe: async function*() {} },
                    userMediaPage: { subscribe: async function*() {} }
                  }
                } satisfies Resolvers,
                origin.resolvers
              ) as Resolvers
          })
        })

        const client = new Client({
          url: 'http://d/graphql',
          exchanges: [fetchExchange],
          fetchSubscriptions: true,
          fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) =>
            server.handleRequest(
              new Request(input, init),
              { ...await context(), client }
            )
        })

        return {
          origin,
          server,
          client
        }
      })

  const mediaResolvers = makeMediaServerResolvers({ graph, origins, context, mergeHandles })
  const episodeResolvers = makeEpisodeServerResolvers({ graph, origins, context, mergeHandles })
  const playbackSourceResolvers = makePlaybackSourceServerResolvers({ graph, origins, context, mergeHandles })
  const userResolvers = makeUserServerResolvers({ graph, origins, context, mergeHandles })

  const schema = createSchema({
    typeDefs,
    resolvers:
      merge(
        mediaResolvers,
        episodeResolvers,
        playbackSourceResolvers,
        userResolvers
      )
  })

  const yoga = createYoga({
    schema,
    maskedErrors: false,
    plugins: [useDeferStream()]
  })

  return {
    yoga
  }
}
