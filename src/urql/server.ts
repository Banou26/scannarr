
import type { YogaServerInstance } from 'graphql-yoga'
import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import { Client, fetchExchange } from 'urql'

import typeDefs from '../graphql'

import { serverResolvers as makeMediaServerResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers } from './episode'
import { serverResolvers as makePlaybackSourceServerResolvers } from './playback-source'
import { serverResolvers as makeUserServerResolvers } from './user'
import { Resolvers } from '../generated/graphql'
import { merge } from '../utils/deep-merge'

export type ServerContext = {
  fetch: typeof fetch
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
  server: YogaServerInstance<ServerContext, any>
  client: Client
}

export const makeScannarrServer = (
  { origins: _origins, context }:
  { origins: Origin[], context?: () => Promise<ServerContext> } =
  { origins: [], context: undefined }
) => {
  const origins =
    _origins
      .map(origin => {
        const server = createYoga({
          maskedErrors: false,
          schema: createSchema({
            typeDefs,
            resolvers:
              merge(
                {
                  Query: {
                    mediaPage: () => ({ nodes: [] }),
                    playbackSourcePage: () => ({ nodes: [] }),
                    episodePage: () => ({ nodes: [] }),
                    authentication: () => [],
                    userMediaPage: () => ({ nodes: [] })
                  },
                  Subscription: {
                    media: { subscribe: async function*() {} },
                    mediaPage: { subscribe: async function*() {} }
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
              await context?.() ?? {}
            )
        })

        return {
          origin,
          server,
          client
        }
      })

  const mediaResolvers = makeMediaServerResolvers({ origins, context })
  const episodeResolvers = makeEpisodeServerResolvers({ origins, context })
  const playbackSourceResolvers = makePlaybackSourceServerResolvers({ origins, context })
  const userResolvers = makeUserServerResolvers({ origins, context })

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
