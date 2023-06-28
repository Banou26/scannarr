import { Policies } from '../apollo'
import { Handle, HandleRelation, Resolvers } from '../generated/graphql'
import { Uris, populateUri, toScannarrId } from './uri'

export const defaultResolvers = (resolvers: Resolvers) => ({
  ...resolvers,
  Page: {
    origin: () => [],
    media: () => [],
    ...resolvers.Page,
  },
  Query: {
    Page: () => ({}),
    ...resolvers.Query
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

export const groupRelatedHandles = <T extends Handle>({ typename, results: _results }: { typename: string, results: T[] }) => {
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

  return {
    groups,
    handleGroups,
    scannarrHandles:
      handleGroups
        .map((handles) =>
          makeScannarrHandle({ typename, handles })
        )
  }
}

export const makeScannarrHandle = ({ typename, handles }: { typename: string, handles: Handle[] }) =>
  populateUri({
    __typename: typename,
    origin: 'scannarr',
    id: toScannarrId(handles.map(handle => handle.uri).join(',') as Uris),
    handles: {
      __typename: `${typename}Connection`,
      edges: handles.map((handle) => ({
        __typename: `${typename}Edge`,
        handleRelationType: HandleRelation.Identical,
        node: {
          __typename: typename,
          ...handle
        }
      })),
      nodes: handles.map((handle) => ({
        __typename: typename,
        ...handle
      }))
    }
  })

const sortHandlePerOrigin = (originPriorityList: string[], handles: Handle[], getHandle: (value: any) => Handle = (value) => value) =>
  [...handles]
    .sort((a, b) => {
      const aPriority = originPriorityList.indexOf(getHandle(a)?.origin)
      const bPriority = originPriorityList.indexOf(getHandle(b)?.origin)
      if (aPriority === -1 && bPriority === -1) return 0
      if (aPriority === -1) return 1
      if (bPriority === -1) return -1
      return aPriority - bPriority
    })

export const makeTypePolicy = (
  { rootTypename, field, policies }:
  { rootTypename: string, field: string, policies: Policies }
) => {

  return ({
    // merge: (existing, incoming) => incoming
    read: (existing, { args, toReference, readField }) => {
      if (readField('origin') !== 'scannarr') return existing
      const handlesOriginValues =
        readField('handles')
          .edges
          .map((edge: any) => [
            readField(edge.node, 'origin'),
            readField(field, edge.node)
          ])

      const sortedHandlesOriginValues =
        sortHandlePerOrigin(
          policies?.[rootTypename]?.[field]?.originPriority ?? [],
          handlesOriginValues,
          (value) => value[1]
        )
      console.log(rootTypename, field, 'existing', existing, 'sortedHandlesOriginValues', sortedHandlesOriginValues)
      return sortedHandlesOriginValues.at(-1)[1]
    }
  })
}

export const makeTypePolicies = (
  { rootTypename, policies, fields }:
  { rootTypename: string, policies: Policies, fields: string[] }
) =>
  Object
    .fromEntries(
      fields
        .map((field) => [
          field,
          makeTypePolicy({ rootTypename, field, policies })
        ])
    )
