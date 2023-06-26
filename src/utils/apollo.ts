import { ApolloQueryResult } from '@apollo/client/core'
import { Handle, Resolvers } from '../generated/graphql'
import { BaseContext, OriginWithResolvers } from '../apollo-aggregator'

export const defaultResolvers = (resolvers: Resolvers) => ({
  ...resolvers,
  Page: {
    origin: () => [],
    ...resolvers.Page,
  },
  MediaCoverImage: {
    default: (mediaCoverImage) =>
      mediaCoverImage.extraLarge
      ?? mediaCoverImage.large
      ?? mediaCoverImage.medium
      ?? mediaCoverImage.small,
    ...resolvers.MediaCoverImage
  },
  MediaConnection: {
    nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge.node) ?? [],
    ...resolvers.MediaConnection
  },
  MediaEpisodeConnection: {
    nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge?.node) ?? [],
    ...resolvers.MediaEpisodeConnection
  }
})

export const indexHandles = <T extends Handle[]>({ results: _results }: { results: T }) => {
  let results = [...new Map(_results.map(item => [item.uri, item])).values()]
  const index: { [key: string]: string[] } = {}
  const alreadyRecursed = new Set()

  const addHandleRecursiveToIndex = (parentHandle: Handle) => {
    if (alreadyRecursed.has(parentHandle.uri)) return
    alreadyRecursed.add(parentHandle.uri)
    
    if (!results.some(handle => handle.uri === handle.uri)) {
      results = [...results, parentHandle]
    }

    if (!index[parentHandle.uri]) index[parentHandle.uri] = [parentHandle.uri]
    const identicalHandles =
      parentHandle
        .handles
        ?.edges
        ?? []
    for (const handle of identicalHandles) {
      if (!index[handle.node.uri]) index[handle.node.uri] = [handle.node.uri]

      if (!index[parentHandle.uri]?.includes(handle.node.uri)) index[parentHandle.uri]?.push(handle.node.uri)
      if (!index[handle.node.uri]?.includes(handle.node.uri)) index[handle.node.uri]?.push(parentHandle.uri)
      for (const uri of index[parentHandle.uri] ?? []) {
        if (!index[uri]?.includes(handle.node.uri)) index[uri]?.push(handle.node.uri)
      }
      for (const uri of index[handle.node.uri] ?? []) {
        if (!index[uri]?.includes(parentHandle.uri)) index[uri]?.push(parentHandle.uri)
      }
      addHandleRecursiveToIndex(handle.node)
    }
  }

  for (const handle of _results) {
    addHandleRecursiveToIndex(handle)
  }

  return {
    results,
    index
  }
}

export const groupRelatedHandles = <T extends Handle[]>({ results: _results }: { results: T }) => {
  const { results, index } = indexHandles({ results: _results })
  const groups =
    [
      ...new Set(
        Object
          .values(index)
          .map((uris) => uris.sort((a, b) => a.localeCompare(b)))
          .map((uris) => uris.join(' '))
      )
    ].map((uris) => uris.split(' '))

  const handleGroups = groups.map((uris) => results.filter((handle) => uris.includes(handle.uri)))
  // const scannarrHandles =
  //   handleGroups
  //     .map((handles) => populateUri({
  //       __typename: typeName,
  //       origin: 'scannarr',
  //       id: toScannarrId(handles.map(handle => handle.uri).join(',') as Uris),
  //       handles: {
  //         __typename: `${typeName}Connection`,
  //         edges: handles.map((handle) => ({
  //           __typename: `${typeName}Edge`,
  //           handleRelationType: HandleRelation.Identical,
  //           node: {
  //             __typename: typeName,
  //             ...handle
  //           }
  //         })),
  //         nodes: handles.map((handle) => ({
  //           __typename: typeName,
  //           ...handle
  //         }))
  //       }
  //     }))

}