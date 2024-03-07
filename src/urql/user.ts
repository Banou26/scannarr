import { getOriginResult, getOriginResults, groupRelatedHandles, makeScannarrHandle2 } from './utils'
import { ServerContext } from './client'
import { Resolvers, UserMedia, UserMediaPage } from '../generated/graphql'
import { mergeOriginSubscriptionResults, observableToAsyncIterable, subscribeToOrigins } from '../utils'
import { map } from 'rxjs'
import { ServerResolverParameters } from './server'

export const serverResolvers = ({ origins, context, mergeHandles }: ServerResolverParameters & { origins: any[], context?: () => Promise<ServerContext> }) => ({
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
    // userMedia: {
    //   subscribe: (_, __, context) =>
    //     observableToAsyncIterable(
    //       subscribeToOrigins({ origins, context, name: 'userMedia' })
    //         .pipe(
    //           map(_results => {
    //             const resultsData =
    //               _results
    //                 .map(result => result.data)
    //                 .filter((data) => Boolean(data))
    //                 .filter(data => Boolean(data?.userMedia))
    //                 .map(data => data?.userMedia as UserMedia)
    //             if (!resultsData.length) return
        
    //             const mediaScannarrHandle = makeScannarrHandle2({
    //               handles:
    //                 resultsData
    //                   .map(userMedia => userMedia?.media),
    //               mergeHandles
    //             })
                
    //             return {
    //               'userMedia': {
    //                 ...makeScannarrHandle2({
    //                   handles: resultsData,
    //                   mergeHandles
    //                 }),
    //                 media: mediaScannarrHandle
    //               }
    //             }
    //           })
    //         )
    //     ),
    //   resolve: (parent) => parent.userMedia
    // },
    // @ts-expect-error
    userMediaPage: {
      subscribe: (_, __, context) =>
        observableToAsyncIterable(
          subscribeToOrigins({
            origins,
            context,
            name: 'userMediaPage'
          }).pipe(
            map(results => {
              const userMedias =
                results
                  .map(result => result.data?.userMediaPage as UserMediaPage)
                  .flatMap(userMediaPage => userMediaPage?.nodes ?? [])

              const { handleGroups } = groupRelatedHandles({
                results:
                  userMedias
                    .map(userMedia => userMedia.media)
              })

              const scannarrHandles =
                handleGroups
                  .map(handles =>
                    makeScannarrHandle2({
                      handles,
                      mergeHandles
                    })
                  )

              try {
                const userMediaScannarHandles = scannarrHandles.map(media => {
                  const matchingUserMedias =
                    userMedias.filter(userMedia =>
                      media.handles.edges.some(handle =>
                        handle.node.uri === userMedia.media.uri
                      )
                    )
                  const scannarrHandles =
                    makeScannarrHandle2({
                      handles: matchingUserMedias,
                      mergeHandles
                    })
  
                  return ({
                    ...scannarrHandles,
                    media
                  })
                })
  
                return {
                  userMediaPage: {
                    edges: userMediaScannarHandles.map(media => ({ node: media })),
                    nodes: userMediaScannarHandles
                  }
                }
              } catch (err) {
                console.error(err)
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
