import { Client, fetchExchange, gql } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { YogaServerInstance } from 'graphql-yoga'
import { devtoolsExchange } from '@urql/devtools'

import { OriginWithResolvers } from '../server'


import { toScannarrUri} from '../utils/uri2'

import { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource } from '../generated/graphql'
import { cacheResolvers as makeMediaCacheResolvers } from './media'
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
      PlaybackSource: (playbackSource) => {
        if (playbackSource.origin !== 'scannarr') return (playbackSource as PlaybackSource).uri
        const handles = (playbackSource as PlaybackSource).handles?.edges.map(handle => handle.node.uri)
        const uri = (handles && toScannarrUri(handles)) ?? (playbackSource as PlaybackSource).uri
        return uri
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
      // EpisodeConnection: {
      //   edges: (result, args, cache, info) => {
      //     console.log('EpisodeConnection.edges UPDATE', result, args, cache, {...info})
      //   }
      // },
      Episode: {
        handles: (result, args, cache, info) => {
          console.log('Episode.handles UPDATE', result, args, cache, {...info})
          const handleUris = result.handles?.edges?.flatMap(edge => edge.node.uri) ?? []
          const uri = toScannarrUri(handleUris)
          const previousUri = info.parentKey.replace('Episode:', '')

          const handleMediaUris = result.handles?.edges?.flatMap(edge => edge.node.media.uri) ?? []
          const mediaUri = toScannarrUri(handleMediaUris)


          if (handleMediaUris?.length) {
            console.log('WRITING', { __typename: 'Episode', uri, media: { __typename: 'Media', uri: mediaUri } })
            // cache.writeFragment(
            //   gql`
            //     fragment EpisodeFragment on Episode {
            //       uri
            //       media {
            //         uri
            //       }
            //     }
            //   `,
            //   { __typename: 'Episode', uri, media: { __typename: 'Media', uri: mediaUri } }
            // )
            cache.writeFragment(
              gql`
                fragment MediaFragment on Media {
                  uri
                  title {
                    romanized
                  }
                }
              `,
              { __typename: 'Media', uri, title: { __typename: 'MediaTitle', romanized: 'test' } }
            )
            cache.link(info.parentKey, 'media', cache.keyOfEntity({ __typename: 'Media', uri: mediaUri }))
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
