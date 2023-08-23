import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { YogaServerInstance } from 'graphql-yoga'
import { devtoolsExchange } from '@urql/devtools'

import { OriginWithResolvers } from '../server'


import { toScannarrUri} from '../utils/uri2'

import { Episode, Media, MediaExternalLink, MediaTrailer } from '../generated/graphql'
import { cacheResolvers as makeMediaCacheResolvers } from './media'
import { cacheResolvers as makeEpisodeCacheResolvers } from './episode'

export type ServerContext = {

}

export type UserContext = {

}

export type OriginWithServer = {
  origin: OriginWithResolvers
  server: YogaServerInstance<{}, {}>
}

export const makeScannarrClient = (
  { context, handleRequest }:
  { context?: () => Promise<ServerContext>, handleRequest: (request: Request, ctx: {}) => Response | Promise<Response> }
) => {
  const cache = cacheExchange({
    keys: {
      Page: () => null,
      Media: (media) => {
        if (media.origin !== 'scannarr') return (media as Media).uri
        const handles = (media as Media).handles?.edges.map(handle => handle.node.uri)
        const uri = (handles && toScannarrUri(handles)) ?? (media as Media).uri
        return uri
      },
      MediaConnection: () => null,
      MediaEdge: () => null,
      Episode: (media) => {
        if (media.origin !== 'scannarr') return (media as Episode).uri
        const handles = (media as Episode).handles?.edges.map(handle => handle.node.uri)
        const uri = (handles && toScannarrUri(handles)) ?? (media as Episode).uri
        return uri
      },
      EpisodeConnection: () => null,
      EpisodeEdge: () => null,
      MediaExternalLink: (mediaExternalLink) => (mediaExternalLink as MediaExternalLink).uri,
      MediaTrailer: (mediaTrailer) => (mediaTrailer as MediaTrailer).uri,
      MediaCoverImage: () => null,
      MediaTitle: () => null,
      FuzzyDate: () => null,
    },
    resolvers: {
      ...makeMediaCacheResolvers({ context }),
      ...makeEpisodeCacheResolvers({ context })
    }
  })

  const client = new Client({
    url: 'http://d/graphql',
    exchanges: [devtoolsExchange, cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) =>
      handleRequest(new Request(input, init), {})
  })

  return {
    client
  }
}
