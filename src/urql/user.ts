import { buildNodeSelectionMap, getOriginResult, getOriginResults, groupRelatedHandles, isFieldNode, isFragmentSpreadNode, makeScannarrHandle2, mapNodeToNodeSelection } from './utils'
import { ServerContext } from './client'
import { Resolvers, UserMediaPage } from '../generated/graphql'
import { groupBy, observableToAsyncIterable, subscribeToOrigins } from '../utils'
import { catchError, combineLatest, map, switchMap, tap, throttleTime } from 'rxjs'
import { ServerResolverParameters } from './server'

export const serverResolvers = ({ graph, origins, context, mergeHandles }: ServerResolverParameters & { origins: any[], context?: () => Promise<ServerContext> }) => ({
  Query: {
    authentications: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      for (const result of results) {
        if (!result.error) continue
        console.error(result.error)
      }

      return (
        results
          .filter(result => result.data?.authentications?.[0])
          .flatMap((result, i) => ({
            ...result.data?.authentications?.[0],
            origin: {
              id: origins[i].origin.origin,
              ...origins[i].origin
            }
          }))
      )
    },
    user: async (parent, { input }, ctx, info) => {
      const origin = origins.find(origin => origin.origin.origin === input.origin)
      const result = await getOriginResult({ ctx, origin, context })
      if (result.errors) {
        throw new Error(
          result
            .errors
            .map(error =>
              `Laserr Error from "${origin?.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.user
    }
  },
  Subscription: {
    userMediaPage: {
      subscribe: (_, __, context, info) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            graph,
            origins,
            context,
            name: 'userMediaPage',
            mergeHandles
          })
          .pipe(
            map(results => {
              try {
                const handles =
                  results
                    .map(result => result.data?.userMediaPage as UserMediaPage)
                    .flatMap(userMediaPage => userMediaPage?.nodes ?? [])

                const handleNodes =
                  handles
                    .map(mediaHandle =>
                      graph.findOne({ uri: mediaHandle.media.uri })
                    )
                return ({
                  mediaPage: {
                    nodes: handleNodes
                  }
                })
              } catch (err) {
                console.error(err)
                return ({
                  mediaPage: {
                    nodes: []
                  }
                })
              }
            }),
            switchMap(({ mediaPage }) =>
              combineLatest(
                mediaPage
                  .nodes
                  .map(node => {
                    const _rootSelectionSet =
                      info
                        .fieldNodes
                        .find(node => node.name.value === 'userMediaPage')
                        ?.selectionSet
                        ?.selections
                        .filter(isFieldNode)
                        ?.find(node => node.name.value === 'nodes')
                        ?.selectionSet
                        // ?.selections
                        // .filter(isFieldNode)
                        // ?.find(node => node.name.value === 'media')
                        // ?.selectionSet
                    
                    const fragment =
                      info
                        .fieldNodes
                        .find(node => node.name.value === 'userMediaPage')
                        ?.selectionSet
                        ?.selections
                        .filter(isFieldNode)
                        ?.find(node => node.name.value === 'nodes')
                        ?.selectionSet
                        ?.selections
                        .find(isFragmentSpreadNode)

                    const rootSelectionSet = _rootSelectionSet ?? info.fragments[fragment.name.value].selectionSet

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
                      ).pipe(
                        map(media => ({
                          ...node,
                          media
                        }))
                      )
                    )
                  })
              )
            ),
            throttleTime(25, undefined, { leading: true, trailing: true }),
            map((results) => {
              const groupById =
                groupBy(
                  results,
                  result => result._id
                )

              const resultNodes =
                [...groupById
                  .values()]
                  .map(group => group[0])

              return {
                userMediaPage: {
                  nodes: resultNodes
                }
              }
            }),
            catchError(err => {
              console.error(err)
              return {
                mediaPage: {
                  nodes: []
                }
              }
            })
          )
        )
    }
  },
  Mutation: {
    authenticate: async (parent, { input }, ctx, info) => {
      const origin = origins.find(origin => origin.origin.origin === input.origin)
      const result = await getOriginResult({ ctx, origin, context })
      if (result.errors) {
        throw new Error(
          result
            .errors
            .map(error =>
              `Laserr Error from "${origin?.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.authenticate
    },
    updateUserMedia: async (parent, { input }, ctx, info) => {
      const origin = origins.find(origin => origin.origin.origin === input.origin)
      const result = await getOriginResult({ ctx, origin, context })
      if (result.errors) {
        throw new Error(
          result
            .errors
            .map(error =>
              `Laserr Error from "${origin?.origin.origin}" at ${error.path.join('->')}: ${error.message}`
            )
            .join('\n')
        )
      }
      return result?.data?.updateUserMedia
    }
  }
} satisfies Resolvers)
