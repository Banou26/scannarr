import type { ServerResolverParameters } from './server'
import { EpisodePage } from '../generated/graphql'

import { map } from 'rxjs/operators'

import { groupRelatedHandles, makeScannarrHandle2 } from './utils'
import { observableToAsyncIterable } from '../utils'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'

export const serverResolvers = ({ origins, mergeHandles }: ServerResolverParameters) => ({
  Subscription: {
    episode: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          mergeOriginSubscriptionResults({
            results:
              subscribeToOrigins({
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
                  edges: scannarrHandles.map(episode => ({ node: episode })),
                  nodes: scannarrHandles
                }
              }
            })
          )
        )
    }
  }
})
