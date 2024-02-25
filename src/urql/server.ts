
import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

// import { typeDefs } from '../generated/schema/typeDefs.generated'
import typeDefs from '../graphql'

import { serverResolvers as makeMediaServerResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers } from './episode'
import { serverResolvers as makePlaybackSourceServerResolvers } from './playback-source'
import { serverResolvers as makeUserServerResolvers } from './user'
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
            maskedErrors: false,
            schema: createSchema({
              typeDefs,
              resolvers: {
                ...origin.resolvers,
                Query: {
                  mediaPage: () => ({ nodes: [] }),
                  playbackSourcePage: () => ({ nodes: [] }),
                  episodePage: () => ({ nodes: [] }),
                  originAuthentication: () => [],
                  ...origin.resolvers.Query
                },
                Mutation: {
                  ...origin.resolvers.Mutation
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
  const userResolvers = makeUserServerResolvers({ origins, context })

  const schema = createSchema({
    typeDefs,
    resolvers: {
      ...mediaResolvers,
      ...episodeResolvers,
      ...playbackSourceResolvers,
      ...userResolvers,
      Query: {
        ...mediaResolvers.Query,
        ...episodeResolvers.Query,
        ...playbackSourceResolvers.Query,
        ...userResolvers.Query
      },
      Mutation: {
        ...userResolvers.Mutation
      }
    }
  })

  const yoga = createYoga({
    schema,
    maskedErrors: false,
    plugins: [useDeferStream()]
  })

  return {
    yoga
  }
}
