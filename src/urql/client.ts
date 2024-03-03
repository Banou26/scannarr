import type { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource, Team } from '../generated/graphql'

import { Client, fetchExchange } from 'urql'
import { cacheExchange } from '@urql/exchange-graphcache'
import { YogaServerInstance } from 'graphql-yoga'
import { devtoolsExchange } from '@urql/devtools'

import { Uri, toScannarrUri} from '../utils'
import { cacheResolvers as makeMediaCacheResolvers, populateMedia } from './media'
import { cacheResolvers as makeEpisodeCacheResolvers } from './episode'
import { cacheResolvers as makePlaybackSourceCacheResolvers } from './playback-source'

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
      // Media: (media) => {
      //   const handlesIds = media.handles?.edges.map(mediaEdge => mediaEdge.node.uri)
      //   if (handlesIds?.length) {
      //     return `scannarr:(${handlesIds.join(',')})`
      //   }
      //   return media.uri
      // },
      UserMediaPage: () => null,
      Authentication: () => null,
      MediaPage: () => null,
      Media: (media) => {
        const handles = (media as Media).handles?.edges.map(handle => handle.node.uri)
        if (!(media.uri as string)?.includes('scannarr')) return (media as Media).uri
        // console.log('KEY Media', toScannarrUri(handles), {...media})
        return toScannarrUri(handles ?? [])
      },
      MediaConnection: () => null,
      MediaEdge: () => null,
      // Episode: (episode) => {
      //   const handlesIds = episode.handles?.edges.map(episodeEdge => episodeEdge.node.uri)
      //     if (handlesIds?.length) {
      //       return `scannarr:(${handlesIds.join(',')})`
      //     }
      //   return episode.uri
      // },
      EpisodePage: () => null,
      Episode: (episode) => {
        const handles = (episode as Episode).handles?.edges.map(handle => handle.node.uri)
        if (!(episode.uri as string)?.includes('scannarr')) return (episode as Episode).uri
        // console.log('KEY Episode', toScannarrUri(handles), {...episode})
        return toScannarrUri(handles ?? [])
      },
      EpisodeConnection: () => null,
      EpisodeEdge: () => null,
      PlaybackSourcePage: () => null,
      PlaybackSource: (playbackSource) => {
        const handles = (playbackSource as PlaybackSource).handles?.edges.map(handle => handle.node.uri)
        if (!(playbackSource?.uri as string)?.includes('scannarr')) return (playbackSource as PlaybackSource).uri
        return toScannarrUri(handles ?? [])
      },
      Team: (team) => {
        const handles = (team as Team).handles?.edges.map(handle => handle.node.uri)
        if (!(team?.uri as string)?.includes('scannarr')) return (team as Team).uri
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
          if (!result.media && (result as Episode).handles?.edges.length) {
            result.media = populateMedia({
              __typename: 'Media',
              uri: info.parentKey.replace('Media:', '') as Uri,
              handles: {
                __typename: 'MediaConnection',
                // @ts-ignore
                edges: (result as Media).handles.edges.map(episodeEdge => ({
                  __typename: 'MediaEdge',
                  node: populateMedia((episodeEdge.node as Episode).media!)
                }))
              }
            })
            return
          }
          if (result.media) {
            // if (!result.media.handles) {
            //   console.log('result', result, args, cache, {...info})
            // }
            result.media = populateMedia({
              // @ts-ignore
              ...result.media,
              handles: {
                __typename: 'MediaConnection',
                edges:
                  // @ts-ignore
                  result.handles?.edges.map(episodeEdge => ({
                    __typename: 'MediaEdge',
                    node: populateMedia(episodeEdge.node.media)
                  }))
                  ?? []
                // edges: result.media.handles.edges.map(episodeEdge => ({
                //   __typename: 'MediaEdge',
                //   node: populateMedia(episodeEdge.node.media)
                // }))
              }
            })
          }
        }
      }
    },
    resolvers: {
      ...makeMediaCacheResolvers({ context }),
      // @ts-ignore
      ...makeEpisodeCacheResolvers({ context }),
      // @ts-ignore
      ...makePlaybackSourceCacheResolvers({ context })
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
