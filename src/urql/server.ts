import type { ServerContext } from '.'

import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

import { typeDefs } from '../generated/schema/typeDefs.generated'

import { serverResolvers as makeMediaServerResolvers } from './media'
import { serverResolvers as makeEpisodeServerResolvers } from './episode'
import { serverResolvers as makePlaybackSourceServerResolvers } from './playback-source'
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
    // resolvers: {
    //   Query: {
    //     Page: () => ({})
    //   },
    //   Page: {
    //     episode: async (parent, args, ctx, info) => ([
    //       {
    //         __typename: 'Episode',
    //         uri: 'scannarr:()',
    //         handles: {
    //           __typename: 'EpisodeConnection',
    //           edges: [{
    //             node: {
    //               __typename: 'Episode',
    //               uri: '2',
    //               bar: 'bar',
    //               handles: {
    //                 __typename: 'EpisodeConnection',
    //                 edges: []
    //               },
    //               media: {
    //                 __typename: 'Media',
    //                 uri: '12',
    //                 handles: {
    //                   __typename: 'MediaConnection',
    //                   edges: []
    //                 }
    //               }
    //             }
    //           }]
    //         }
    //       }
    //     ])
    //   }
    // }
    resolvers: {
      ...mediaResolvers,
      ...episodeResolvers,
      ...playbackSourceResolvers,

      Page: {
        origin: () => [],
        episode: () => [],
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
