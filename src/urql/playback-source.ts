import type { ServerResolverParameters } from './server'

import { map, switchMap, tap } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles, isFieldNode, mapNodeToNodeSelection, buildNodeSelectionMap } from './utils'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { PlaybackSourcePage } from '../generated/graphql'
import { combineLatest } from 'rxjs'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  Subscription: {
    playbackSource: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            graph,
            results:
              subscribeToOrigins({
                graph,
                origins,
                context,
                name: 'playbackSource',
                mergeHandles
              }),
            mergeHandles,
            name: 'playbackSource'
          })
        )
    },
    playbackSourcePage: {
      subscribe: (_, __, context, info) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'playbackSourcePage',
            mergeHandles
          }).pipe(
            map(results => {
              const handles =
                results
                  .map(result => result.data?.playbackSourcePage as PlaybackSourcePage)
                  .flatMap(playbackSourcePage => playbackSourcePage?.nodes ?? [])

              const handleNodes =
                handles
                  .map(mediaHandle =>
                    graph.findOne({ uri: mediaHandle.uri })
                  )

              return {
                playbackSourcePage: {
                  nodes: handleNodes
                }
              }
            }),
            switchMap(({ playbackSourcePage }) =>
              combineLatest(
                playbackSourcePage
                  .nodes
                  .map(node => {
                    const rootSelectionSet =
                      info
                        .fieldNodes
                        .find(node => node.name.value === 'playbackSourcePage')
                        ?.selectionSet
                        ?.selections
                        .filter(isFieldNode)
                        ?.find(node => node.name.value === 'nodes')
                        ?.selectionSet

                    if (!rootSelectionSet) throw new Error('No rootSelectionSet')

                    return (
                      graph.mapOne(
                        { _id: node._id },
                        (data) =>
                          mapNodeToNodeSelection(
                            graph,
                            buildNodeSelectionMap(info),
                            data.handles.find(handle => handle.origin === 'scannarr')
                          )
                      )
                    )
                  })
              )
            ),
            map(results => ({
              playbackSourcePage: {
                nodes: results
              }
            }))
          )
        )
    }
  }
})
