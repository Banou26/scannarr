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
        const handles = (media as Media).handles?.edges.map(handle => handle.node.uri)
        if (!media.uri?.includes('scannarr')) return (media as Media).uri
        console.log('KEY Media', toScannarrUri(handles), media)
        return toScannarrUri(handles ?? [])
      },
      MediaConnection: () => null,
      MediaEdge: () => null,
      Episode: (episode) => {
        const handles = (episode as Episode).handles?.edges.map(handle => handle.node.uri)
        if (!episode.uri?.includes('scannarr')) return (episode as Episode).uri
        console.log('KEY Episode', toScannarrUri(handles), episode)
        return toScannarrUri(handles ?? [])
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
          console.log('UPDATE Episode.handles', result, args, cache, {...info})
          if (!result.media) {
            result.media = {
              __typename: 'Element',
              uri: info.parentKey.replace('Element:', ''),
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
          result.media.handles = {
            __typename: 'MediaConnection',
            edges: result.handles.edges.map(episodeEdge => ({
              __typename: 'MediaEdge',
              node: episodeEdge.node.media
            }))
          }

          // const parentUri =
          //   result.uri?.includes('scannarr')
          //     ? info.parentKey.replace('Episode:', '')
          //     : result.uri as string | undefined
          // const isScannarr = parentUri && isScannarrUri(parentUri)
          // if (!isScannarr) return
          // const handlesMedia = result.handles?.edges.map(episodeEdge => episodeEdge.node.media)
          // if (handlesMedia.length === 0) return
          // console.log('Episode.handles', result, args, cache, {...info})
          // const handleMediaUris = handlesMedia.map(media => media.uri)
          // const scannarrUri = toScannarrUri(handleMediaUris)

          // console.log('scannarrUri', scannarrUri, cache.resolve(info.parentKey, 'media'))

          

          // if (!result.media) {
          //   result.media = {
          //     __typename: 'Media',
          //     uri: scannarrUri,
          //     handles: {
          //       __typename: 'MediaConnection',
          //       edges: handlesMedia.map(media => ({
          //         __typename: 'MediaEdge',
          //         node: media
          //       }))
          //     }
          //   }
          // } else {
          //   result.media.handles.edges = result.handles?.edges.map(episode => episode.media) ?? []
          // }
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
