
import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

import { typeDefs } from '../generated/schema/typeDefs.generated'

import { serverResolvers as makeMediaServerResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers } from './episode'
import { serverResolvers as makePlaybackSourceServerResolvers } from './playback-source'
import { ServerContext } from './client'

export const makeScannarrServer = (
  { origins: _origins, context }:
  { origins: any[], context?: () => Promise<ServerContext> } =
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
                  episode: () => [],
                  media: () => [],
                  playbackSource: () => [],
                  ...origin.resolvers.Page
                },
                EpisodeConnection: {
                  // this breaks episodes on media
                  // edges: () => [],
                  ...origin.resolvers.EpisodeConnection
                },
                PlaybackSourceConnection: {
                  ...origin.resolvers.PlaybackSourceConnection
                }
              }
            }),
            plugins: [useDeferStream()]
          })
      }))

  const mediaResolvers = makeMediaServerResolvers({ origins, context })
  const episodeResolvers = makeEpisodeServerResolvers({ origins, context })
  const playbackSourceResolvers = makePlaybackSourceServerResolvers({ origins, context })

  const schema = createSchema({
    typeDefs,
    resolvers: {
      ...mediaResolvers,
      ...episodeResolvers,
      ...playbackSourceResolvers,

      Page: {
        origin: () => [],
        // @ts-expect-error
        episode: () => [],
        // @ts-expect-error
        playbackSource: () => [],
        ...mediaResolvers.Page,
        ...episodeResolvers.Page,
        ...playbackSourceResolvers.Page
      },

      Query: {
        Page: () => ({}),
        ...mediaResolvers.Query,
        ...episodeResolvers.Query,
        ...playbackSourceResolvers.Query
      }
    }
  })

  const yoga = createYoga({
    schema,
    plugins: [useDeferStream()]
  })

  return {
    yoga
  }
}
