import { Client, fetchExchange, gql } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { YogaServerInstance } from 'graphql-yoga'
import { devtoolsExchange } from '@urql/devtools'

import { OriginWithResolvers } from '../server'


import { isScannarrUri, toScannarrUri} from '../utils/uri2'

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
        if (!media.uri?.includes('scannarr')) return (media as Media).uri
        const handles = (media as Media).handles?.edges.map(handle => handle.node.uri)
        const uri = (handles && toScannarrUri(handles)) ?? (media as Media).uri
        console.log('Media uri', media, uri)
        return uri
      },
      MediaConnection: () => null,
      MediaEdge: () => null,
      Episode: (media) => {
        if (!media.uri?.includes('scannarr')) return (media as Episode).uri
        const handles = (media as Episode).handles?.edges.map(handle => handle.node.uri)
        const uri = (handles && toScannarrUri(handles)) ?? (media as Episode).uri
        console.log('Episode uri', media, uri)
        return uri
      },
      EpisodeConnection: () => null,
      EpisodeEdge: () => null,
      PlaybackSource: (playbackSource) => {
        if (!playbackSource?.uri?.includes('scannarr')) return (playbackSource as PlaybackSource).uri
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
          const parentUri =
            result.uri?.includes('scannarr')
              ? info.parentKey.replace('Episode:', '')
              : result.uri as string | undefined
          const isScannarr = parentUri && isScannarrUri(parentUri)
          if (!isScannarr) return
          console.log('Episode.handles UPDATE', result, args, cache, {...info})
          const query = gql`
            fragment MediaFragment on Media {
              uri
            }

            query UpdateMediaHandles ($uri: String!) {
              Media(uri: $uri) {
                ...MediaFragment
                handles {
                  edges {
                    node {
                      ...EpisodeFragment
                    }
                  }
                }
              }
            }
          `

          const handleUris = result.handles?.edges?.flatMap(edge => edge.node.uri) ?? []
          const uri = toScannarrUri(handleUris)
          const previousUri = info.parentKey.replace('Episode:', '')


          const handleMediaUris = result.handles?.edges?.flatMap(edge => edge.node.media.uri) ?? []
          const mediaUri = toScannarrUri(handleMediaUris)

          cache.updateQuery(
            { query, variables: { uri: mediaUri } },
            data => {
              console.log('updateQuery data', data, mediaUri)
              if (!data) {
                const res = {
                  Media: {
                    __typename: 'Media',
                    uri: mediaUri,
                    handles: result.handles
                  }
                }
                console.log('updateQuery new data !111111111', {...res})

                return res
              }
              console.log('updateQuery BEFORE data', {...data})
              data.handles = result.handles
              data.uri = uri
              console.log('updateQuery new data 2222222222', {...data})
              return data
            }
          )

          console.log(
            'SET MEDIA EPISODE LINK',
            info.parentKey,
            'media',
            cache.keyOfEntity({ __typename: 'Media', uri: mediaUri })
          )
          cache.link(info.parentKey, 'media', cache.keyOfEntity({ __typename: 'Media', uri: mediaUri }))

          console.log(
            'SET HANDLE LINKS',
            cache.keyOfEntity({ __typename: 'Media', uri: mediaUri }),
            'handles.edges',
            [...handleUris.map(uri => cache.keyOfEntity({ __typename: 'Episode', uri }))]
          )
          cache.link(
            cache.keyOfEntity({ __typename: 'Media', uri: mediaUri }),
            'handles.edges',
            [...handleUris.map(uri => cache.keyOfEntity({ __typename: 'Episode', uri }))]
          )

          console.log('rESSSSSSSS', cache.readQuery({ query, variables: { uri: mediaUri } }))
          console.log(
            'rESSSSSSSS2',
            previousUri,
            cache.readQuery({ query: gql`
            query ($uri: String!) {
              Episode(uri: $uri) {
                uri
                # media {
                #   uri
                # }
              }
            }`, variables: { uri: previousUri } }),
            cache.readFragment(gql`
              fragment _ on Episode {
                uri
                media {
                  uri
                }
              }
            `, { uri: previousUri })
          )
        }

        // handles: (result, args, cache, info) => {
        //   console.log('Episode.handles UPDATE', result, args, cache, {...info})
        //   const handleUris = result.handles?.edges?.flatMap(edge => edge.node.uri) ?? []
        //   const uri = toScannarrUri(handleUris)
        //   const previousUri = info.parentKey.replace('Episode:', '')

        //   const handleMediaUris = result.handles?.edges?.flatMap(edge => edge.node.media.uri) ?? []
        //   const mediaUri = toScannarrUri(handleMediaUris)


        //   if (handleMediaUris?.length) {
        //     console.log('WRITING', { __typename: 'Episode', uri, media: { __typename: 'Media', uri: mediaUri } })
        //     // cache.writeFragment(
        //     //   gql`
        //     //     fragment EpisodeFragment on Episode {
        //     //       uri
        //     //       media {
        //     //         uri
        //     //       }
        //     //     }
        //     //   `,
        //     //   { __typename: 'Episode', uri, media: { __typename: 'Media', uri: mediaUri } }
        //     // )
        //     cache.writeFragment(
        //       gql`
        //         fragment MediaFragment on Media {
        //           uri
        //           title {
        //             romanized
        //           }
        //         }
        //       `,
        //       { __typename: 'Media', uri, title: { __typename: 'MediaTitle', romanized: 'test' } }
        //     )
        //     cache.link(info.parentKey, 'media', cache.keyOfEntity({ __typename: 'Media', uri: mediaUri }))
        //   }
        // }
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
