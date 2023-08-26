import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core'
import type { GraphQLResolveInfo, GraphQLType } from 'graphql'

import { isListType, isNonNullType, isObjectType } from 'graphql'
import { Handle, HandleRelation } from '../generated/graphql'
import { Uri, Uris, populateHandle, toScannarrId } from './uri'
import { mergeDeep } from './merge'

export const graphify = (
  { client, results: _results, typeName, normalizedKey, info }:
  { client: ApolloClient<NormalizedCacheObject>, results: Handle[], typeName: string, normalizedKey: string, info: GraphQLResolveInfo }
) => {
  let results = [...new Map(_results.map(item => [item.uri, item])).values()]

  const addTypename = (value: any, type: GraphQLType) => {
    if (value === null || value === undefined) return null
    if (isNonNullType(type)) return addTypename(value, type.ofType)
    if (isListType(type)) return value.map((item: any) => addTypename(item, type.ofType))
    if (isObjectType(type)) {
      return {
        __typename: type.name,
        ...Object.fromEntries(
          Object
            .entries(value)
            .map(([key, value]) => [
              key,
              addTypename(value, type.getFields()[key]?.type!)
            ])
        )
       }
    }
    return value
  }

  try {
    const previousState = client.extract(true)

    const index: { [key: string]: string[] } = {}
    const alreadyRecursed = new Set()

    const addHandleRecursiveToIndex = (_handle: Handle) => {
      if (alreadyRecursed.has(_handle.uri)) return
      alreadyRecursed.add(_handle.uri)
      
      if (!results.some(handle => handle.uri === _handle.uri)) {
        results = [...results, _handle]
      }

      if (!index[_handle.uri]) index[_handle.uri] = [_handle.uri]
      const identicalHandles =
        _handle
          .handles
          .edges
          .filter(handleConnection =>
            handleConnection?.handleRelationType === HandleRelation.Identical
          )
      for (const handle of identicalHandles) {
        if (!index[handle.node.uri]) index[handle.node.uri] = [handle.node.uri]

        if (!index[_handle.uri]?.includes(handle.node.uri)) index[_handle.uri]?.push(handle.node.uri)
        if (!index[handle.node.uri]?.includes(handle.node.uri)) index[handle.node.uri]?.push(_handle.uri)
        for (const uri of index[_handle.uri] ?? []) {
          if (!index[uri]?.includes(handle.node.uri)) index[uri]?.push(handle.node.uri)
        }
        for (const uri of index[handle.node.uri] ?? []) {
          if (!index[uri]?.includes(_handle.uri)) index[uri]?.push(_handle.uri)
        }
        addHandleRecursiveToIndex(handle.node)
      }
    }

    for (const handle of results) {
      addHandleRecursiveToIndex(handle)
    }

    const groups =
      [
        ...new Set(
          Object
            .values(index)
            .map((uris) => uris.sort((a, b) => a.localeCompare(b)))
            .map((uris) => uris.join(' '))
        )
      ].map((uris) => uris.split(' '))

    // console.log('groups', groups)

    const handleGroups = groups.map((uris) => results.filter((handle) => uris.includes(handle.uri)))
    // console.log('handleGroups', handleGroups)

    const scannarrHandles =
      handleGroups
        .map((handles) => populateHandle({
          __typename: typeName,
          origin: 'scannarr',
          id: toScannarrId(handles.map(handle => handle.uri).join(',') as Uris),
          handles: {
            __typename: `${typeName}Connection`,
            edges: handles.map((handle) => ({
              __typename: `${typeName}Edge`,
              handleRelationType: HandleRelation.Identical,
              node: {
                __typename: typeName,
                ...handle
              }
            })),
            nodes: handles.map((handle) => ({
              __typename: typeName,
              ...handle
            }))
          }
        }))

    const newState = {
      ...previousState,
      ...Object.fromEntries(
        [...scannarrHandles, ...results].map((result) => [
          `${typeName}:{"uri":"${result.uri}"}`,
          // @ts-expect-error
          addTypename(result, info.returnType.ofType?.ofType ?? info.returnType.ofType)
        ])
      ),
      ROOT_QUERY: {
        "__typename": "Query",
        ...previousState.ROOT_QUERY,
        ...Object.fromEntries(
          [...scannarrHandles, ...results].map((result) => [
            `${normalizedKey}({"uri":"${result.uri}"})`,
            { __ref: `${typeName}:{"uri":"${result.uri}"}` }
          ])
        ),
      }
    }

    client.cache.restore(newState)

    // console.log('scannarrHandles', scannarrHandles)

    const finalResults = [
      ...scannarrHandles
        .filter(Boolean)
        .map(handle => ({
          ...Object.fromEntries(
            [
              ...Object.entries(handle),
              ...handle.handles.nodes.flatMap(handle => Object.entries(handle))
            ]
              .map(([key, value]) => [
                key,
                handle.handles.nodes
                  ? (
                    mergeDeep(
                      value,
                      ...handle
                        .handles
                        .nodes
                        ?.map(handle => handle.node?.[key])
                        .filter((value: any) => !!value)
                    )
                    ?? value
                  )
                  : value
              ])
          ),
          ...handle
        })),
    ]
    return finalResults
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
