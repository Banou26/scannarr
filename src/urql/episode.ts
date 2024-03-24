import type { ServerResolverParameters } from './server'
import { EpisodePage } from '../generated/graphql'

import { map } from 'rxjs/operators'

import { groupRelatedHandles, makeScannarrHandle2 } from './utils'
import { observableToAsyncIterable } from '../utils'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  Subscription: {
    episode: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            graph,
            results:
              subscribeToOrigins({
                graph,
                origins,
                context,
                name: 'episode'
              }),
            mergeHandles,
            name: 'episode'
          })
        )
    },
    episodePage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'episodePage'
          }).pipe(
            map(results => {
              const { handleGroups } = groupRelatedHandles({
                results:
                  results
                    .map(result => result.data?.episodePage as EpisodePage)
                    .flatMap(episodePage => episodePage?.nodes ?? [])
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
                episodePage: {
                  nodes: scannarrHandles
                }
              }
            })
          )
        )
    }
  }
})
