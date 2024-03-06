import type { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource, Team } from '../generated/graphql'
import type { ServerContext } from '.'

import { Client, fetchExchange } from 'urql'
import { cacheExchange } from '@urql/exchange-graphcache'
import { YogaServerInstance } from 'graphql-yoga'
import { devtoolsExchange } from '@urql/devtools'

import { cacheResolvers as makeMediaCacheResolvers } from './media'

export type {
  ServerContext,
  UserContext,
} from './server'

export type OriginWithServer = {
  server: YogaServerInstance<{}, {}>
}

export const makeScannarrClient = (
  {
    context,
    handleRequest,
    introspectionSchema
  }:
  {
    context?: () => Promise<ServerContext>,
    handleRequest: (input: RequestInfo | URL, init?: RequestInit | undefined) => Response | Promise<Response>
    introspectionSchema: any
  }
) => {
  const cache = cacheExchange({
    schema: introspectionSchema,
    keys: {
      UserMediaPage: () => null,
      Authentication: () => null,
      MediaPage: () => null,
      Media: (media) => (media as Media).uri,
      MediaConnection: () => null,
      MediaEdge: () => null,
      Episode: (episode) => (episode as Episode).uri,
      EpisodePage: () => null,
      EpisodeConnection: () => null,
      EpisodeEdge: () => null,
      PlaybackSourcePage: () => null,
      PlaybackSource: (playbackSource) => (playbackSource as PlaybackSource).uri,
      Team: (team) => (team as Team).uri,
      PlaybackSourceConnection: () => null,
      PlaybackSourceEdge: () => null,
      MediaExternalLink: (mediaExternalLink) => (mediaExternalLink as MediaExternalLink).uri,
      MediaTrailer: (mediaTrailer) => (mediaTrailer as MediaTrailer).uri,
      MediaCoverImage: () => null,
      MediaTitle: () => null,
      FuzzyDate: () => null,
    },
    resolvers: {
      ...makeMediaCacheResolvers({ context }),
    }
  })

  const client = new Client({
    url: 'http://d/graphql',
    exchanges: [devtoolsExchange, cache, fetchExchange],
    fetchSubscriptions: true,
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) => {
      const { body, headers } = await handleRequest(input, init)
      return new Response(body, { headers: Object.fromEntries(headers.entries()) })
    }
  })

  return {
    client
  }
}
