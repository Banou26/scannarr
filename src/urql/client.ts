import { Client, fetchExchange, gql } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { YogaServerInstance } from 'graphql-yoga'
import { devtoolsExchange } from '@urql/devtools'

import { OriginWithResolvers } from '../server'


import { isScannarrUri, toScannarrUri} from '../utils/uri2'

import { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource } from '../generated/graphql'
import { cacheResolvers as makeMediaCacheResolvers, populateMedia } from './media'
import { cacheResolvers as makeEpisodeCacheResolvers } from './episode'
import { cacheResolvers as makePlaybackSourceCacheResolvers } from './playback-source'
import introspection from '../generated/graphql.schema.json'

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
  { context?: () => Promise<ServerContext>, handleRequest: (input: RequestInfo | URL, init?: RequestInit | undefined) => Response | Promise<Response> }
) => {
  const cache = cacheExchange({
    schema: introspection,
    keys: {
      Page: () => null,
      Media: (media) => {
        const handlesIds = media.handles?.edges.map(mediaEdge => mediaEdge.node.uri)
        if (handlesIds?.length) {
            console.log('KEY Media', `scannarr:(${handlesIds.join(',')})`, media)
            return `scannarr:(${handlesIds.join(',')})`
        }
        return media.uri
      },
      MediaConnection: () => null,
      MediaEdge: () => null,
      Episode: (episode) => {
        const handlesIds = episode.handles?.edges.map(episodeEdge => episodeEdge.node.uri)
          if (handlesIds?.length) {
            console.log('KEY Episode', `scannarr:(${handlesIds.join(',')})`, episode)
            return `scannarr:(${handlesIds.join(',')})`
          }
        return episode.uri
      },
      EpisodeConnection: () => null,
      EpisodeEdge: () => null,
      PlaybackSource: (playbackSource) => {
        const handles = (playbackSource as PlaybackSource).handles?.edges.map(handle => handle.node.uri)
        if (!playbackSource?.uri?.includes('scannarr')) return (playbackSource as PlaybackSource).uri
        return toScannarrUri(handles ?? [])
      },
      PlaybackSourceConnection: () => null,
      PlaybackSourceEdge: () => null,
      MediaExternalLink: (mediaExternalLink) => (mediaExternalLink as MediaExternalLink).uri,
      MediaTrailer: (mediaTrailer) => (mediaTrailer as MediaTrailer).uri,
      MediaCoverImage: () => null,
      MediaTitle: () => null,
      FuzzyDate: () => null,
    },
    updates: {
      Episode: {
        handles: (result, args, cache, info) => {
          if (!info.parentKey.includes('scannarr')) return
          if (!result.media && result.handles?.edges.length) {
            result.media = {
              __typename: 'Media',
              uri: info.parentKey.replace('Media:', ''),
              handles: {
                __typename: 'MediaConnection',
                edges: result.handles.edges.map(episodeEdge => ({
                  __typename: 'MediaEdge',
                  node: episodeEdge.node.media
                }))
              }
            }
            return
          }
          if (result.media) {
            result.media.handles.edges =
              result.handles?.edges.map(episodeEdge => ({
                __typename: 'MediaEdge',
                node: episodeEdge.node.media
              }))
              ?? []
          }
        }
      }
    },
    resolvers: {
      ...makeMediaCacheResolvers({ context }),
      ...makeEpisodeCacheResolvers({ context }),
      ...makePlaybackSourceCacheResolvers({ context })
    }
  })

  const client = new Client({
    url: 'http://d/graphql',
    exchanges: [devtoolsExchange, cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) => {
      const { body, headers } = await handleRequest(input, init)
      return new Response(body, { headers: Object.fromEntries(headers.entries()) })
    }
  })

  return {
    client
  }
}
