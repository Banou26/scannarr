import { ReadFieldFunction } from '@apollo/client/cache/core/types/common'
import { Policies } from '../apollo'
import { Handle, HandleRelation, Resolvers } from '../generated/graphql'
import { Uris, populateUri, toScannarrId } from './uri'
import { getEdges } from './handle'

export const defaultResolvers = (resolvers: Resolvers) => ({
  ...resolvers,
  Page: {
    origin: () => [],
    media: () => [],
    episode: () => [],
    playbackSource: () => [],
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
  EpisodeConnection: {
    nodes: (mediaConnection) => mediaConnection.edges?.map(edge => edge?.node) ?? [],
    ...resolvers.EpisodeConnection
  }
})

export const indexHandles = <T extends Handle[]>({ results: _results }: { results: T }) => {
  let results = [...new Map(_results.map(item => [item.uri, item])).values()]
  const index: { [key: string]: string[] } = {}
  const alreadyRecursed = new Set()

  const addHandleRecursiveToIndex = (parentHandle: Handle, force = false) => {
    if (alreadyRecursed.has(parentHandle.uri) && !force) return
    alreadyRecursed.add(parentHandle.uri)
    
    if (!results.some(handle => handle.uri === handle.uri)) {
      results = [...results, parentHandle]
    }

    if (!index[parentHandle.uri]) index[parentHandle.uri] = [parentHandle.uri]
    const identicalHandles = getEdges(parentHandle.handles) ?? []
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
    addHandleRecursiveToIndex(handle, true)
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

export const makeScannarrHandle = ({ typename, handles, readField }: { typename: string, handles: Handle[], readField?: ReadFieldFunction }) =>
  populateUri({
    __typename: typename,
    origin: 'scannarr',
    id: toScannarrId(handles.map(handle => readField ? readField('uri', handle) : handle.uri).join(',') as Uris),
    url: '',
    handles: {
      __typename: `${typename}Connection`,
      edges: handles.map((handle) => ({
        __typename: `${typename}Edge`,
        handleRelationType: HandleRelation.Identical,
        node: {
          __typename: typename,
          ...handle,
          uri: readField ? readField('uri', handle) : handle.uri
        }
      })),
      nodes: handles.map((handle) => ({
        __typename: typename,
        ...handle,
        uri: readField ? readField('uri', handle) : handle.uri
      }))
    }
  })

const sortHandlePerOrigin = (originPriorityList: string[], handles: Handle[], getOrigin: (value: any) => string = (value) => value) =>
  [...handles]
    .sort((a, b) => {
      const aPriority = originPriorityList.indexOf(getOrigin(a))
      const bPriority = originPriorityList.indexOf(getOrigin(b))
      if (aPriority === -1 && bPriority === -1) return 0
      if (aPriority === -1) return 1
      if (bPriority === -1) return -1
      return aPriority - bPriority
    })

export const makePrimitiveTypePolicy = ({ fieldName, policy }: { fieldName: string, policy: Policies[string][string] }) => ({
  read: (existing, { readField }) => {
    if (readField('origin') !== 'scannarr') return existing
    const handlesOriginValues =
      getEdges(readField('handles'))
        .map((edge: any) => [
          readField('origin', edge.node),
          readField(fieldName, edge.node)
        ])

    const sortedHandlesOriginValues =
      sortHandlePerOrigin(
        policy?.originPriority ?? [],
        handlesOriginValues,
        (value) => value[0]
      )

    return (
      sortedHandlesOriginValues
        .reduce(
          (acc, [origin, value]) => value ?? acc,
          sortedHandlesOriginValues.at(0)?.[1]
        )
    )
  }
})

export const makeObjectTypePolicy = ({ fieldName, policy, defaultValue }: { fieldName: string, policy?: Policies[string][string], defaultValue?: any }) => ({
  read: (existing, { readField }) => {
    if (readField('origin') !== 'scannarr') return existing
    const handlesOriginValues =
      getEdges(readField('handles'))
        .map((edge: any) => [
          readField('origin', edge.node),
          readField(fieldName, edge.node)
        ])

    const sortedHandlesOriginValues =
      sortHandlePerOrigin(
        policy?.originPriority ?? [],
        handlesOriginValues,
        (value) => value[0]
      )

    return (
      sortedHandlesOriginValues
        .reduce((acc, [origin, value]) => ({
          ...acc,
          ...value && Object.fromEntries(
            Object
              .entries(value)
              .filter(([key, val]) => val !== null && val !== undefined)
          )
        }), defaultValue ?? sortedHandlesOriginValues.at(0)?.[1])
    )
  }
})

export const makeArrayTypePolicy = ({ fieldName, policy }: { fieldName: string, policy?: Policies[string][string] }) => ({
  read: (existing, { readField }) => {
    if (readField('origin') !== 'scannarr') return existing
    const handlesOriginValues =
      getEdges(readField('handles'))
        .map((edge: any) => [
          readField('origin', edge.node),
          readField(fieldName, edge.node)
        ])

    const sortedHandlesOriginValues =
      sortHandlePerOrigin(
        policy?.originPriority ?? [],
        handlesOriginValues,
        (value) => value[0]
      )

    return (
      sortedHandlesOriginValues
        .flatMap(([origin, value]) => value ?? [])
        .filter((value, i, items) =>
          value.__ref
            ? items.findIndex((item) => item.__ref === value.__ref) === i
            : true
        )
    )
  }
})
