import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { createYoga, createSchema, YogaInitialContext, YogaServerInstance } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import { devtoolsExchange } from '@urql/devtools'

import { OriginWithResolvers } from '../server'

import { typeDefs } from '../generated/schema/typeDefs.generated'

import { targets as origins } from '../../../laserr/src/index'
import { fromScannarrUri, fromUri, isScannarrUri, toScannarrId, toScannarrUri} from '../utils/uri2'

import { Episode, Media, MediaExternalLink, MediaTrailer } from '../generated/graphql'
import { serverResolvers as makeMediaServerResolvers, cacheResolvers as makeMediaCacheResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers, cacheResolvers as makeEpisodeCacheResolvers } from './episode'

export type ServerContext = {

}

export type UserContext = {

}

export type OriginWithServer = {
  origin: OriginWithResolvers
  server: YogaServerInstance<{}, {}>
}

const makeScannarr = (
  { origins: _origins, context }:
  { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> } =
  { origins: [], context: undefined }
) => {
  const origins =
    _origins
      .map(origin => ({
        origin,
        server:
          createYoga({
            schema: createSchema({
              typeDefs,
              resolvers: {
                ...origin.resolvers,
                Query: {
                  Page: () => ({}),
                  ...origin.resolvers.Query
                },
                Page: {
                  media: () => [],
                  ...origin.resolvers.Page
                },
                EpisodeConnection: {
                  edges: () => [],
                  ...origin.resolvers.EpisodeConnection
                }
              }
            }),
            plugins: [useDeferStream()]
          })
      }))

  const mediaCacheResolvers = makeMediaCacheResolvers({ origins, context })
  const episodeCacheResolvers = makeEpisodeCacheResolvers({ origins, context })

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
      ...mediaCacheResolvers,
      ...episodeCacheResolvers
    }
  })

  const mediaResolvers = makeMediaServerResolvers({ origins, context })
  const episodeResolvers = makeEpisodeServerResolvers({ origins, context })

  const schema = createSchema({
    typeDefs,
    resolvers: {
      ...mediaResolvers,
      ...episodeResolvers,

      Page: {
        origin: () => [],
        episode: () => [],
        playbackSource: () => [],
        ...mediaResolvers.Page,
        ...episodeResolvers.Page
      },

      Query: {
        Page: () => ({}),
        ...mediaResolvers.Query,
        ...episodeResolvers.Query
      }
    }
  })

  const yoga = createYoga({
    schema,
    plugins: [useDeferStream()]
  })
 
  const client = new Client({
    url: 'http://d/graphql',
    exchanges: [devtoolsExchange, cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) =>
      yoga.handleRequest(new Request(input, init), {})
  })

  return {
    yoga,
    client
  }
}

export default makeScannarr
