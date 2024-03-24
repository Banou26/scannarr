import type { ServerResolverParameters } from './server'

import { map } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles } from './utils'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { PlaybackSourcePage } from '../generated/graphql'

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
                name: 'playbackSource'
              }),
            mergeHandles,
            name: 'playbackSource'
          })
        )
    },
    playbackSourcePage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'playbackSourcePage'
          }).pipe(
            map(results => {
              const { handleGroups } = groupRelatedHandles({
                results:
                  results
                    .map(result => result.data?.playbackSourcePage as PlaybackSourcePage)
                    .flatMap(playbackSourcePage => playbackSourcePage?.nodes ?? [])
              })
              const scannarrHandles =
                handleGroups
                  .map(handles =>
                    makeScannarrHandle2({
                      handles,
                      mergeHandles
                    })
                  )
              return {
                playbackSourcePage: {
                  nodes: scannarrHandles
                }
              }
            })
          )
        )
    }
  }
})
