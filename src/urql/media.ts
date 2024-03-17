import type { Cache, ResolveInfo } from '@urql/exchange-graphcache'

import type { ServerResolverParameters } from './server'
import { HandleRelation, Media, type MediaPage, type Resolvers } from '../generated/graphql'

import { map, mergeMap, tap } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { getNodeId, mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { groupBy, isScannarrUri } from '../utils'
import { combineLatest } from 'rxjs'
import { Node } from './graph'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  Media: {
    // @ts-expect-error
    episodes: (parent, args, ctx, info) => {
      if (!isScannarrUri(parent.uri)) return parent.episodes

      const originHandles =
        (parent.episodes?.edges.map(edge => edge.node)
          ?? parent.episodes?.nodes
          ?? [])
        .flatMap(episode =>
          episode?.handles?.edges.map(edge => edge.node)
            ?? episode?.handles?.nodes
            ?? []
        )
          
      const groupedEpisodes = [
        ...groupBy(
          originHandles,
          episode => episode.number
        )
      ]

      const scannarrEpisodes =
        groupedEpisodes
          .filter(([episodeNumber]) => episodeNumber !== null && episodeNumber !== undefined)
          .map(([, handles]) =>
            makeScannarrHandle2({
              handles,
              mergeHandles
            })
          )

      return {
        edges: scannarrEpisodes.map(episode => ({
          handleRelationType: HandleRelation.Identical,
          node: episode
        })),
        nodes: scannarrEpisodes
      }
    }
  },
  Subscription: {
    media: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            graph,
            results:
              subscribeToOrigins({
                graph,
                origins,
                context,
                name: 'media'
              }),
            mergeHandles,
            name: 'media'
          })
        ),
      resolve: (parent) => parent?.media
    },
    mediaPage: {
      subscribe: (_, __, context, info) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'mediaPage'
          }).pipe(
            map(results => {
              const { handleGroups } = groupRelatedHandles({
                results:
                  results
                    .map(result => result.data?.mediaPage as MediaPage)
                    .flatMap(mediaPage => mediaPage?.nodes ?? [])
              })
              const scannarrHandles =
                handleGroups
                  .map(handles =>
                    makeScannarrHandle2({
                      handles,
                      mergeHandles
                    })
                  ) as Media[]

              for (const scannarrHandle of scannarrHandles) {
                const handles =
                  scannarrHandle
                    .handles
                    .edges
                    .map(edge => edge.node)

                const handleNodes =
                  handles
                    .map(handle =>
                      graph.findOne({ uri: handle.uri }, { returnNode: true })
                      ?? graph.insertOne(handle, { returnNode: true })
                    )
                // console.log('handleNodes', handleNodes)
                
                const foundScannarrHandleNode =
                  handleNodes
                    .flatMap(node =>
                      (node.data as Media)
                        .handles
                        ?.edges
                        .map(edge => edge.node as Node<Media>)
                        .filter(handleNode => handleNode.origin === 'scannarr')
                        ?? []
                    )
                    .at(0)

                const existingScannarrHandleNode =
                  foundScannarrHandleNode
                  ?? graph.insertOne(scannarrHandle, { returnNode: true })

                for (const handleNode of handleNodes) {
                  const handleNodeData = handleNode.data as Media
                  // if (handleNodeData.handles?.edges.some(edge => edge.node.origin === 'scannarr')) continue
                  // console.log('TEST', handleNodeData, handleNodeData.handles?.edges.some(edge => edge.node.origin === 'scannarr'))
                  graph.updateOne(
                    { _id: handleNode._id },
                    {
                      $set: {
                        handles: {
                          edges: [
                            ...handleNodeData.handles?.edges.map(edge => ({
                              ...edge,
                              node: graph.findOne({ uri: edge.node.uri }, { returnNode: true })
                            })) ?? [],
                            ...handleNodeData.handles?.edges.some(edge => edge.node.origin === 'scannarr')
                              ? []
                              : [{ handleRelationType: HandleRelation.Identical, node: existingScannarrHandleNode }]
                          ]
                        }
                      }
                    }
                  )
                }
                graph.updateOne(
                  { _id: existingScannarrHandleNode._id },
                  {
                    $set: {
                      handles: {
                        edges: [
                          ...handleNodes.map(handleNode => ({
                            handleRelationType: HandleRelation.Identical,
                            node: handleNode
                          }))
                        ]
                      }
                    }
                  }
                )
              }


              console.log('info', info)
              return {
                mediaPage: {
                  edges: scannarrHandles.map(media => ({ node: media })),
                  nodes: scannarrHandles
                }
              }
            }),
            // mergeMap(({ mediaPage }) =>
            //   combineLatest(
            //     mediaPage
            //       .nodes
            //       .map(node =>
            //         graph
            //           .getNode(getNodeId(node))
            //           ?.map(nodeValue => ({
            //             ...nodeValue,
            //             __node: graph.getNode(getNodeId(node))
            //           }))
            //       )
            //   )
            // ),
            // map((results) => console.log('results', results) || ({
            //   mediaPage: {
            //     edges: results.map(node => ({ node })),
            //     nodes: results
            //   }
            // }))
          )
        )
    }
  }
} satisfies Resolvers)

export const cacheResolvers = ({ context }: { context?: () => Promise<ServerContext> }) => ({
  MediaCoverImage: {
    default: (_, __, cache: Cache, info: ResolveInfo) => {
      const coverImageRefs =
        cache
          .resolve(
            {
              __typename: 'Media',
              uri: info.parentKey.slice('Media:'.length, info.parentKey.indexOf('.coverImage'))
            },
            `coverImage`
          )

      const coverImageRef = (coverImageRefs as string[])?.at(Number(info.parentKey.split('.').at(-1)))
      
      if (!coverImageRef) return null

      return (
        cache.resolve(coverImageRef, 'extraLarge')
        ?? cache.resolve(coverImageRef, 'large')
        ?? cache.resolve(coverImageRef, 'medium')
        ?? cache.resolve(coverImageRef, 'small')
      )
    }
  }
})
