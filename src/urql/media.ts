import type { Cache, ResolveInfo } from '@urql/exchange-graphcache'

import type { ServerResolverParameters } from './server'
import { Media, type MediaPage, type Resolvers } from '../generated/graphql'

import { catchError, map, switchMap, tap } from 'rxjs/operators'

import { makeScannarrHandle2, groupRelatedHandles } from './utils'
import { ServerContext } from './client'
import { observableToAsyncIterable } from '../utils/observableToAsyncIterable'
import { mergeOriginSubscriptionResults, subscribeToOrigins } from '../utils/origin'
import { fromScannarrUri, groupBy, isScannarrUri } from '../utils'
import { combineLatest, lastValueFrom, of } from 'rxjs'

export const serverResolvers = ({ graph, origins, mergeHandles }: ServerResolverParameters) => ({
  Media: {
    // @ts-expect-error
    episodes: (parent, args, ctx, info) => {
      if (!isScannarrUri(parent.uri)) return parent.episodes

      const originHandles =
        parent
          .episodes
          .flatMap(episode => episode.handles ?? [])

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

      return scannarrEpisodes
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
                name: 'media',
                mergeHandles
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
            name: 'mediaPage',
            mergeHandles
          }).pipe(
            map(results => {
              try {
                const handles =
                  results
                    .map(result => result.data?.mediaPage as MediaPage)
                    .flatMap(mediaPage => mediaPage?.nodes ?? [])

                const handleNodes =
                  handles
                    .map(mediaHandle =>
                      graph.findOne((node) => node.uri === mediaHandle.uri)
                    )

                const { handleGroups } = groupRelatedHandles({ results: handleNodes })
                const scannarrHandles =
                  handleGroups
                    .map(handles =>
                      makeScannarrHandle2({
                        handles,
                        mergeHandles
                      })
                    ) as Media[]

                const scannarrNodes = scannarrHandles.map(handle =>
                  graph.findOne((node) =>
                    node.origin === 'scannarr' &&
                    fromScannarrUri(handle.uri)
                      ?.handleUris
                      .some(handleUri => node.uri.includes(handleUri))
                  )
                )

                console.log('scannarrNodes', scannarrNodes)

                return ({
                  mediaPage: {
                    nodes: scannarrNodes
                  }
                })

                // return (
                //   combineLatest(scannarrNodes.map(node => graph.mapOne(node!._id, (data) => data)))
                //     .pipe(
                //       map(results => ({
                //         mediaPage: {
                //           nodes: results
                //         }
                //       })),
                //       tap(val => console.log('val', val))
                //     )
                // )
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
                    const isFieldNode = (node: SelectionNode): node is FieldNode => node.kind === 'Field'
                    const isFragmentSpreadNode = (node: SelectionNode): node is FragmentSpreadNode => node.kind === 'FragmentSpread'

                    const mapNodeToSelection = <T extends Node<any>>(currentNode: T, selection: SelectionSetNode | FragmentSpreadNode) => {
                      // console.log('currentNode', currentNode, selection)
                      if (Array.isArray(currentNode)) {
                        return currentNode.map(nodeValue => mapNodeToSelection(nodeValue, selection))
                      }

                      if (!currentNode) return null
                      const selections =
                        selection.kind === 'FragmentSpread'
                          ? info.fragments[selection.name.value]?.selectionSet.selections
                          : selection.selections

                      if (!selections) throw new Error('No selections')

                      const buildObjectWithValue = (nodeValue: T) => ({
                        ...nodeValue,
                        ...selections
                          .filter(isFieldNode)
                          .reduce((result, node) => ({
                            ...result,
                            [node.name.value]:
                              node.selectionSet
                                ? mapNodeToSelection(nodeValue[node.name.value], node.selectionSet)
                                : nodeValue[node.name.value]
                          }), {}),
                        ...selections
                          .filter(isFragmentSpreadNode)
                          .reduce((result, node) => ({
                            ...result,
                            ...Object.fromEntries(
                              (info.fragments[node.name.value]?.selectionSet.selections ?? [])
                                .filter(isFieldNode)
                                .map(node => [
                                  node.name.value,
                                  node.selectionSet
                                    ? mapNodeToSelection(nodeValue[node.name.value], node.selectionSet)
                                    : nodeValue[node.name.value]
                                ])
                            )
                          }), {})
                      })

                      if (!currentNode?.__graph_type__) {
                        return buildObjectWithValue(currentNode)
                      }
                      const res = currentNode.map(buildObjectWithValue)
                      // console.log('res', res, currentNode)
                      return res
                    }

                    const rootSelectionSet =
                      info
                        .fieldNodes
                        .find(node => node.name.value === 'mediaPage')
                        ?.selectionSet
                        ?.selections
                        .filter(isFieldNode)
                        ?.find(node => node.name.value === 'nodes')
                        ?.selectionSet

                    if (!rootSelectionSet) throw new Error('No rootSelectionSet')

                    // const mappedSelection = mapNodeToSelection(node, rootSelectionSet)
                    // console.log('node', node)
                    // console.log('nodeValue', nodeValue)
                    // console.log('mappedSelection', node, mappedSelection)
                    return graph.mapOne(node._id, (data) => mapNodeToSelection(data, rootSelectionSet))
                  })
              )
            ),
            map((results) => console.log('results', results) || ({
              mediaPage: {
                nodes: results
              }
            })),
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
