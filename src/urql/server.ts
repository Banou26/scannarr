import type { ServerContext } from '.'

import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

import { typeDefs } from '../generated/schema/typeDefs.generated'

import { serverResolvers as makeMediaServerResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers } from './episode'
import { OriginWithResolvers } from '../server'

export const makeScannarrServer = (
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
                  // this breaks episodes on media
                  // edges: () => [],
                  ...origin.resolvers.EpisodeConnection
                }
              }
            }),
            plugins: [useDeferStream()]
          })
      }))

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

  return {
    yoga
  }
}
