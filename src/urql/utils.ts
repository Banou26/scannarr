import deepmerge from 'deepmerge'

import { fromScannarrUri, fromUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri'
import { YogaInitialContext } from 'graphql-yoga'
import { Handle } from '../generated/graphql'
import { ServerContext } from './client'
import { HandleType } from './server'
import { groupBy, merge } from '../utils'
import { InMemoryGraphDatabase, Node, isNodeType, recursiveRemoveNullable } from './_graph'
import { FieldNode, FragmentSpreadNode, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLOutputType, GraphQLResolveInfo, SelectionNode, SelectionSetNode } from 'graphql'
import { FragmentDefinitionNode } from 'graphql'

export const isFieldNode = (node: SelectionNode): node is FieldNode => node.kind === 'Field'
export const isFragmentSpreadNode = (node: SelectionNode): node is FragmentSpreadNode => node.kind === 'FragmentSpread'

export const isNodeTypename = value =>
  value === 'Media' ||
  value === 'Episode' // ||
  // value === 'UserMedia' ||
  // value === 'PlaybackSource' ||
  // value === 'Team' ||
  // value === 'MediaExternalLink' ||
  // value === 'MediaTrailer'

const containsNode = (data) =>
  Object
    .entries(data)
    .some(([key, value]) => {
      if (key === '__typename' && isNodeTypename(value)) return true
      if (Array.isArray(value)) return value.some(containsNode)
      if (value && typeof value === 'object') {
        return containsNode(value)
      }
    })

const filterNonNodes = (data) =>
  Object.fromEntries(
    Object
      .entries(data)
      .filter(([key, value]) => (key === '__typename' && isNodeTypename(value)) || (value && containsNode(value)))
      .map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(filterNonNodes)
        : value && typeof value === 'object' ? filterNonNodes(value)
        : value
      ])
  )


const nodeSelectionMapCache = new Map<string, any>()

export const buildNodeSelectionMap = (info: GraphQLResolveInfo) => {
  if (info.operation.name && nodeSelectionMapCache.has(info.operation.name.value)) {
    return nodeSelectionMapCache.get(info.operation.name.value)
  }
  const result =
    filterNonNodes(
      buildSelectionMap(info)
    )

  if (!info.operation.name) throw new Error('No operation name')
  nodeSelectionMapCache.set(info.operation.name.value, result)

  return result
}

const selectionMapCache = new Map<string, any>()

export const buildSelectionMap = (info: GraphQLResolveInfo) => {
  if (info.operation.name && selectionMapCache.has(info.operation.name.value)) {
    return selectionMapCache.get(info.operation.name.value)
  }

  const buildSelectionObject = (selection: FieldNode | FragmentDefinitionNode, currentType: GraphQLObjectType) => {
    const fields = currentType.getFields()
    return (
      Object.fromEntries([
        ...selection
          ?.selectionSet
          ?.selections
          .filter(isFieldNode)
          .map(fieldSelection =>
            fieldSelection.name.value === '__typename'
              ? [fieldSelection.name.value, currentType.name]
              : [fieldSelection.name.value, recurse(fieldSelection, fields[fieldSelection.name.value].type)]
          )
          ?? [],
        ...selection
          ?.selectionSet
          ?.selections
          .filter(isFragmentSpreadNode)
          .map(fieldSelection => Object.entries(recurse(fieldSelection, currentType)))
          .flat()
          ?? []
      ])
    )
  }

  const recurse = (selection: FieldNode, currentType: GraphQLObjectType) => {
    //  NonNullable type, using this method since using the `GraphQLList` instances is not working
    if (currentType.toJSON().endsWith('!')) {
      return recurse(selection, currentType.ofType)
    }
    // Array type
    if (currentType.toJSON().startsWith('[')) {
      if (selection.selectionSet) {
        return [recurse(selection, currentType.ofType)]
      } else {
        return [currentType.ofType.name]
      }
    }
    if (isFieldNode(selection)) {
      if (selection.selectionSet) {
        return buildSelectionObject(selection, currentType)
      } else {
        return currentType.name
      }
    }
    if (isFragmentSpreadNode(selection)) {
      const fragment = info.fragments[selection.name.value]
      if (!fragment) throw new Error(`No fragment found for ${selection.name.value}`)
      return buildSelectionObject(fragment, currentType)
    }
  }

  const operationType = info.operation.operation
  const operationSchema = info.schema.getRootType(operationType)
  if (!operationSchema) throw new Error(`No operation ${operationType} schema found`)

  if (info.fieldNodes.length > 1) throw new Error('Multiple root field nodes not supported')

  const result =
    Object
      .fromEntries(
        info
          .fieldNodes
          .map(node => [
            operationType,
            recurse(node, operationSchema.getFields()[node.name.value].type)
          ])
      )

  if (!info.operation.name) throw new Error('No operation name')
  selectionMapCache.set(info.operation.name.value, result)

  return result
}

export const mapNodeToNodeSelection = <T extends Node | Node[]>(graph: InMemoryGraphDatabase, nodeSelectionMap: any, currentNode: T) => {
  if (Array.isArray(nodeSelectionMap)) {
    return (
      (currentNode as Node[])
        .map(nodeValue =>
          mapNodeToNodeSelection(graph, nodeSelectionMap[0], nodeValue)
        )
    )
  }

  const buildObjectWithValue = (nodeValue: T) => ({
    ...nodeValue,
    ...Object.fromEntries(
      Object
        .entries(nodeSelectionMap)
        .map(([key, value]) => [
          key,
          nodeValue?.[key] && mapNodeToNodeSelection(graph, value, nodeValue?.[key])
        ])
        .filter(([_, value]) => value !== undefined)
    )
  })

  if (!isNodeType(currentNode)) {
    return buildObjectWithValue(currentNode)
  }

  if (currentNode._id) {
    return graph.mapOne({ _id: currentNode._id }, data => buildObjectWithValue(data))
  }

  return graph.mapOne({ uri: currentNode.uri }, data => buildObjectWithValue(data))
}

export const mapNodeToSelection = <T extends Node>(graph: InMemoryGraphDatabase, info: GraphQLResolveInfo, currentNode: T, selection: SelectionSetNode | FragmentSpreadNode) => {  
  if (Array.isArray(currentNode)) {
    return currentNode.map(nodeValue => mapNodeToSelection(graph, info, nodeValue, selection))
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
            ? mapNodeToSelection(graph, info, nodeValue[node.name.value], node.selectionSet)
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
                ? mapNodeToSelection(graph, info, nodeValue[node.name.value], node.selectionSet)
                : nodeValue[node.name.value]
            ])
        )
      }), {})
  })

  if (!isNodeType(currentNode)) {
    return buildObjectWithValue(currentNode)
  }

  if (currentNode._id) {
    return graph.mapOne({ _id: currentNode._id }, data => buildObjectWithValue(data))
  }


  // todo: FIX THIS, IT SHOULD NEVER BE THE CASE THAT THIS THROWS, THERES AN ISSUE SOMWEHERE THAT DOESNT INSERT THE NODES INTO THE GRAPH
  try {
    return (
      graph
        .mapOne(
          { uri: currentNode.uri },
          data => buildObjectWithValue(data)
        )
    )
  } catch (err) {
    return currentNode
  }

  // return (
  //   currentNode.origin === 'scannarr'
  //     ? (
  //       graph.findOne((scannarrNode) =>
  //         scannarrNode.origin === 'scannarr' &&
  //         fromScannarrUri(scannarrNode.uri)
  //           ?.handleUris
  //           .some(handleUri =>
  //             fromScannarrUri(currentNode.uri)
  //               ?.handleUris
  //               .some(handle => handleUri === handle.uri)
  //           )
  //       )
  //     )
  //     : (
  //       graph
  //         .mapOne(
  //           data => data.uri === currentNode.uri,
  //           data => buildObjectWithValue(data)
  //         )
  //     )
  // )
}

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
    const identicalHandles = parentHandle.handles ?? []
    for (const handle of identicalHandles) {
      if (!index[handle.uri]) index[handle.uri] = [handle.uri]

      if (!index[parentHandle.uri]?.includes(handle.uri)) index[parentHandle.uri]?.push(handle.uri)
      if (!index[handle.uri]?.includes(handle.uri)) index[handle.uri]?.push(parentHandle.uri)
      for (const uri of index[parentHandle.uri] ?? []) {
        if (!index[uri]?.includes(handle.uri)) index[uri]?.push(handle.uri)
      }
      for (const uri of index[handle.uri] ?? []) {
        if (!index[uri]?.includes(parentHandle.uri)) index[uri]?.push(parentHandle.uri)
      }
      addHandleRecursiveToIndex(handle)
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

function mergeRelatedArrays(arrays: string[][]): [string, Set<string>][] {
  const mergedMap = new Map<string, Set<string>>();

  for (const arr of arrays) {
    let mergedSet: Set<string> | undefined;

    for (const uri of arr) {
      if (mergedSet === undefined) {
        mergedSet = mergedMap.get(uri);
        if (mergedSet === undefined) {
          mergedSet = new Set(arr);
          mergedMap.set(uri, mergedSet);
        }
      } else {
        const existingSet = mergedMap.get(uri);
        if (existingSet !== undefined) {
          for (const n of mergedSet) {
            existingSet.add(n);
          }
          mergedSet = existingSet;
        } else {
          for (const n of arr) {
            mergedSet.add(n);
          }
          mergedMap.set(uri, mergedSet);
        }
      }
    }
  }

  return [...mergedMap.entries()]
}

export const groupRelatedHandles = <T extends Handle>({ results: _results }: { results: T[] }) => {
  const { results, index } = indexHandles({ results: _results })
  const _groups =
    [
      ...new Set(
        Object
          .values(index)
          .map((uris) => uris.sort((a, b) => a.localeCompare(b)))
          .map((uris) => uris.join(' '))
      )
    ].map((uris) => uris.split(' '))

  const groups = mergeRelatedArrays(_groups)

  const handleLookup: Record<string, T> = {}
  for (const handle of results) {
    handleLookup[handle.uri] = handle
  }

  const handleGroups =
    groups
      .map(([uri, set]) => {
        const groupHandles: T[] = []
        for (const uri of set) {
          const handle = handleLookup[uri]
          if (handle) {
            groupHandles.push(handle)
          }
        }
        return groupHandles
      })
      .sort((a, b) => b.length - a.length)

  return {
    groups,
    handleGroups
  }
}

// const recursiveRemoveNullable = <T>(obj: T): T =>
//   (
//     Array.isArray(obj)
//       ? obj.map(recursiveRemoveNullable)
//       : (
//         typeof obj === 'object'
//           ? (
//             Object
//               .fromEntries(
//                 Object
//                   .entries(obj as Object)
//                   .filter(([_, value]) => value !== null && value !== undefined)
//                   .map(([key, value]) => [key, recursiveRemoveNullable(value)])
//               )
//           )
//           : obj
//       )
//   ) as unknown as T

export const makeScannarrHandle2 = ({ handles, mergeHandles }: { handles: HandleType[], mergeHandles: <T2 extends HandleType[]>(handles: T2) => T2[number] }) => {
  const handlesSet = new Set()
  const getRecursiveHandles = (handle: Handle): Handle[] => {
    if (handlesSet.has(handle)) return []
    handlesSet.add(handle)
    if (handlesSet.has(handle.uri)) return []
    handlesSet.add(handle.uri)

    return [
      handle,
      ...(
        handle
          .handles
          ?.flatMap(handle => getRecursiveHandles(handle))
        ?? []
      )
    ]
  }

  const foundHandles = handles.flatMap(handle => getRecursiveHandles(handle))
  const uniqueHandles =
    [...groupBy(foundHandles, (handle) => handle.uri) as Map<string, HandleType[]>]
      .map(([_, handles]) => merge(...recursiveRemoveNullable(handles)) as HandleType)
  const handleUris = uniqueHandles.map(handle => handle.uri)
  const id = toScannarrId(handleUris)
  const uri = toScannarrUri(handleUris)

  const __typename = uniqueHandles[0]?.__typename

  if (!__typename) throw new Error('No __typename found in makeScannarrHandle2')

  return ({
    __typename,
    ...mergeHandles(uniqueHandles),
    origin: 'scannarr',
    id,
    uri,
    url: null,
    handles: uniqueHandles
  })
}

export const makeScannarrHandle = ({ typename, handles, readField }: { typename: string, handles: Handle[], readField?: any }) => {
  const getRecursiveHandles = (handle: Handle) => [
    handle,
    ...(
      handle
        .handles
        .flatMap(getRecursiveHandles)
    )
  ]

  const handleUris = handles.flatMap(handle => getRecursiveHandles(handle)).map(handle => handle.uri)
  const id = toScannarrId(handleUris)
  const uri = toScannarrId(handleUris)
  
  return ({
    __typename: typename,
    origin: 'scannarr',
    // id,
    // uri,
    id: '()',
    uri: 'scannarr:()',
    url: '',
    handles
  })
}

export const getOriginResult = async (
  { ctx, origin, context }:
  { ctx: YogaInitialContext, origin: any, context?: () => Promise<ServerContext> }
) =>
  origin
    .server
    .handleRequest(
      new Request(
        ctx.request.url,
        {
          method: 'POST',
          body: JSON.stringify({
            query: ctx.params.query?.replaceAll('@stream', ''),
            variables: ctx.params.variables
          }),
          headers: { 'Content-Type': 'application/json' }
        }
      ),
      {
        ...await context?.(),
        server: origin.server,
        origin: {
          ...origin.origin,
          id: origin.origin.origin
        }
      }
    )
    .then(response => response.json())

export const getOriginResults = async (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: any[], context?: () => Promise<ServerContext> }
) => {
  const rootUri = ctx.params.variables?.input?.uri
  const uris =
    rootUri && isScannarrUri(rootUri)
      ? fromScannarrUri(rootUri)?.handleUris
      : undefined

  const resultPromises =
    (await Promise.all(
      (uris ?? [undefined])
        .flatMap(uri =>
          origins
            .filter(({ origin }) => uri ? origin.supportedUris?.includes(fromUri(uri).origin) : true)
            .map(async ({ origin, server }) => {
              let resolve, reject
              const promise = new Promise<{ data: any, origin: any }>((res, rej) => {
                resolve = res
                reject = rej
              })

              const callResolver = () =>
                (async () =>
                  server
                    .handleRequest(
                      new Request(
                        ctx.request.url,
                        {
                          method: 'POST',
                          body: JSON.stringify({
                            query: ctx.params.query?.replaceAll('@stream', ''),
                            variables:
                              uri
                                ? ({
                                  input: {
                                    ...ctx.params.variables?.input,
                                    uri,
                                    id: fromUri(uri).id,
                                    origin: fromUri(uri).origin
                                  }
                                })
                                : ctx.params.variables
                          }),
                          headers: { 'Content-Type': 'application/json' }
                        }
                      ),
                      {
                        ...await context?.(),
                        server,
                        origin: {
                          ...origin,
                          id: origin.origin
                        },
                        results:
                          resultPromises
                            .filter(({ origin: _origin }) => _origin.origin !== origin.origin)
                            .map(({ promise, origin }) => ({
                              data: promise.then(result => result.data),
                              origin
                            }))
                      }
                    ))()
                  .then(response => response.json())
              return {
                origin,
                promise,
                callResolver
              }
            })
        )
    ))
    .filter((result) => !result.errors?.length)

  return await Promise.all(resultPromises.map(({ callResolver }) => callResolver()))
}

export async function *getOriginResultsStreamed (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: any[], context?: () => Promise<ServerContext> }
) {
  const rootUri = ctx.params.variables?.input?.uri
  const uris =
    rootUri && isScannarrUri(rootUri)
      ? fromScannarrUri(rootUri)?.handleUris
      : undefined

  const resultPromises =
    (uris ?? [undefined])
      .flatMap(uri =>
        origins
          .filter(({ origin }) => uri ? origin.supportedUris?.includes(fromUri(uri).origin) : true)
          .map(({ origin, server }) => {
            let resolve, reject
            const promise = new Promise<{ data: any, origin: any }>((res, rej) => {
              resolve = res
              reject = rej
            })

            const callResolver = () =>
              (async () =>
                server
                  .handleRequest(
                    new Request(
                      ctx.request.url,
                      {
                        method: 'POST',
                        body: JSON.stringify({
                          query: ctx.params.query?.replaceAll('@stream', ''),
                          variables:
                            uri
                              ? ({
                                input: {
                                  ...ctx.params.variables?.input,
                                  uri,
                                  id: fromUri(uri).id,
                                  origin: fromUri(uri).origin
                                }
                              })
                              : ctx.params.variables
                        }),
                        headers: { 'Content-Type': 'application/json' }
                      }
                    ),
                    {
                      ...await context?.(),
                      server,
                      results:
                        resultPromises
                          .filter(({ origin: _origin }) => _origin.origin !== origin.origin)
                          .map(({ promise, origin }) => ({
                            data: promise.then(result => result.data),
                            origin
                          }))
                    }
                  ))()
                .then(response => response.json())
                .then(result => {
                  const res = ({
                    ...result,
                    origin,
                  })
                  resolve(res)
                  return res
                })
                .catch(err => {
                  const error = new Error(`Error in origin for ${origin.name}:\n${err.message}`)
                  error.stack = `Error in origin for ${origin.name}:\n${err.stack}`
                  console.error(error)
                  reject(err)
                  throw err
                })
            
            return {
              origin,
              promise,
              callResolver
            }
          })
      )

  const results = resultPromises.map(({ callResolver }) => callResolver())

  const promiseList = [...results]

  while (promiseList.length > 0) {
    const [value, index] = await Promise.race(promiseList.map((p, i) => p.then((val) => [val, i])))
    yield await value
    promiseList.splice(index, 1)
  }
}


export const makeScalarResolver =
  <T extends any>({ __typename, fieldName, defaultValue }: { __typename: string, fieldName: string, defaultValue: T }) =>
    (parent, args, cache, info) => {
      const parentUri = parent.uri as string | undefined
      if (!parentUri) return parent[fieldName]
      const isScannarr = parentUri && isScannarrUri(parentUri)
      if (isScannarr) {
        // console.log('scalar', parent, args, cache, {...info})
        return (
          fromScannarrUri(parentUri)
            ?.handleUris
            ?.map(uri => cache.resolve({ __typename, uri }, fieldName) as string | undefined)
            .reduce(
              // @ts-ignore
              (acc, fieldValue) => fieldValue ?? acc,
              defaultValue
            )
        )
      }

      return cache.resolve({ __typename, uri: parentUri }, fieldName)
    }

export const makeArrayResolver =
  ({ __typename, fieldName }: { __typename: string, fieldName: string }) =>
    (parent, args, cache, info) => {
      const parentUri = parent.uri as string | undefined
      if (!parentUri) return parent[fieldName]
      const isScannarr = parentUri && isScannarrUri(parentUri)

      if (isScannarr) {
        return (
          fromScannarrUri(parentUri)
            ?.handleUris
            ?.flatMap(uri => cache.resolve({ __typename, uri }, fieldName))
          ?? []
        )
      }

      return cache.resolve({ __typename, uri: parentUri }, fieldName)
    }

export const makeObjectResolver =
  <T extends Record<string, any>>({ __typename, fieldName, objectTypename, fields, defaultValue }: { __typename: string, objectTypename: string, fieldName: string, fields: string[], defaultValue: T }) =>
    (parent, args, cache, info) => {
      const parentUri = parent.uri as string | undefined
      if (!parentUri) return parent.fieldName
      const isScannarr = parentUri && isScannarrUri(parentUri)

      if (isScannarr) {
        return (
          fromScannarrUri(parentUri)
            ?.handleUris
            ?.map(uri => {
              const fieldRef = cache.resolve({ __typename, uri }, fieldName) as string | undefined
              return (
                fields.reduce(
                  (acc, field) => ({
                    ...acc,
                    [field]: cache.resolve(fieldRef, field)
                  }),
                  {}
                )
              )
            })
            .reduce(
              (acc, field) =>
                deepmerge(
                  acc,
                  Object.fromEntries(
                    Object
                      .entries(field)
                      .filter(([, value]) => value !== null)
                  )
                ),
              { ...defaultValue, __typename: objectTypename }
            )
        )
      }

      return {
        __typename: objectTypename,
        ...fields.reduce(
          (acc, field) => ({
            ...acc,
            [field]: cache.resolve(cache.resolve({ __typename, uri: parentUri }, fieldName), field)
          }),
          {}
        )
      }
    }
