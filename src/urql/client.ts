import type { ServerContext } from '.'
import { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource, Team } from '../generated/graphql'

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

export const keyResolvers = {
  UserMediaPage: () => null,
  Authentication: () => null,
  AuthenticationMethod: () => null,
  MediaPage: () => null,
  Media: (media) => (media as Media)._id,
  Episode: (episode) => (episode as Episode)._id,
  EpisodePage: () => null,
  PlaybackSourcePage: () => null,
  PlaybackSource: (playbackSource) => (playbackSource as PlaybackSource)._id,
  Team: (team) => (team as Team)._id,
  MediaExternalLink: (mediaExternalLink) => (mediaExternalLink as MediaExternalLink)._id,
  MediaTrailer: (mediaTrailer) => (mediaTrailer as MediaTrailer)._id,
  MediaCoverImage: () => null,
  MediaTitle: () => null,
  FuzzyDate: () => null,
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
    keys: keyResolvers,
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
