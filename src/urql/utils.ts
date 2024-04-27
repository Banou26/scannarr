import deepmerge from 'deepmerge'

import { fromScannarrUri, fromUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri'
import { YogaInitialContext } from 'graphql-yoga'
import { Handle } from '../generated/graphql'
import { ServerContext } from './client'
import { HandleType } from './server'
import { groupBy, merge } from '../utils'
import { InMemoryGraphDatabase, Node, isNodeType, recursiveRemoveNullable } from './graph'
import { FieldNode, FragmentSpreadNode, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLOutputType, GraphQLResolveInfo, SelectionNode, SelectionSetNode } from 'graphql'
import { FragmentDefinitionNode } from 'graphql'

export const isFieldNode = (node: SelectionNode): node is FieldNode => node.kind === 'Field'
export const isFragmentSpreadNode = (node: SelectionNode): node is FragmentSpreadNode => node.kind === 'FragmentSpread'

const isNodeTypename = value =>
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

export const buildSelectionMap = (info: GraphQLResolveInfo) => {
  const typeMap = info.schema.getTypeMap()

  const buildFragment = (fragment: FragmentDefinitionNode, currentType: GraphQLObjectType) => ({
    ...Object.fromEntries(
      (fragment.selectionSet.selections ?? [])
        .filter(isFieldNode)
        .map(node => [
          node.name.value,
          node.selectionSet ? recurse(node, currentType)
          : node.name.value === '__typename' ? currentType.name
          : undefined
        ])
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) =>
          typeof value === 'object'
            ? (
              Object.entries(value)
                .map(([key, value]) => [key, value])
                .flat()
            )
            : [key, value]
        )
    ),
    // __typename: fragment.name.value
  })

  const recurse = (selection: FieldNode | FieldNode[], currentType: GraphQLObjectType) => {
    console.log('recurse', selection, currentType)
    //  NonNullable type
    if (currentType.toJSON().endsWith('!')) {
      return recurse(selection, currentType.ofType)
    }
    if (Array.isArray(selection)) {
      return selection.map(node => recurse(node, currentType))
    }
    // Array type
    if (currentType.toJSON().startsWith('[')) {
      let _typenameCurrentType = currentType
      while ('ofType' in _typenameCurrentType) {
        _typenameCurrentType = _typenameCurrentType.ofType
      }

      return [{
        ...Object.fromEntries(
          [
            ...new Set(
              [recurse(selection.selectionSet.selections, currentType.ofType)]
                .flat()
                .filter(Boolean)
                .map((value) => Object.entries(value))
                .flat()
            )
          ]
        ),
        __typename: _typenameCurrentType.name
      }]
    }
    if (isFieldNode(selection)) {
      const fields = currentType.getFields()
      return {
        [selection.name.value]:
          selection
            .selectionSet
            ?.selections
            .filter(value => isFieldNode(value) || isFragmentSpreadNode(value))
            .reduce((result, node) => ({
              ...result,
              ...(
                isFieldNode(node)
                  ? {
                    [node.name.value]:
                      node.selectionSet
                        ? recurse(node, fields[node.name.value]?.type as GraphQLObjectType)
                        : (
                          node.name.value === '__typename'
                            ? currentType.name
                            : undefined
                        )
                  }
                  : {}
              ),
              ...(
                isFragmentSpreadNode(node)
                  ? buildFragment(info.fragments[node.name.value], currentType)
                  // ? console.log('fragment node', node, selection, currentType) || recurse(info.fragments[node.name.value].selectionSet, typeMap[info.fragments[node.name.value].typeCondition.name.value] as GraphQLObjectType)
                  : {}
              )
            }), {})
      }
    }
    if (isFragmentSpreadNode(selection)) {
      const fragment = info.fragments[selection.name.value]
      if (!fragment) throw new Error(`No fragment found for ${selection.name.value}`)
      return buildFragment(fragment, currentType)
    }
  }
  return recurse(info.fieldNodes as FieldNode[], info.returnType as GraphQLObjectType)
}

// export const buildSelectionMap = (info: GraphQLResolveInfo) => {
//   const typeMap = info.schema.getTypeMap()

//   const recurse = (selection: SelectionNode, currentType: GraphQLObjectType) => {
//     console.log('recurse', selection, currentType)
//     if (isFieldNode(selection)) {
//       const field = currentType.getFields()[selection.name.value]
//       if (field?.type instanceof GraphQLObjectType) {
//         return {
//           [selection.name.value]: recurse(selection.selectionSet, field.type)
//         }
//       } else if (field?.type instanceof GraphQLList) {
//         return {
//           [selection.name.value]: [
//             recurse(selection.selectionSet, field.type.ofType as GraphQLObjectType)
//           ]
//         }
//       } else if (field?.type instanceof GraphQLNonNull) {
//         return {
//           [selection.name.value]: recurse(selection.selectionSet, field.type.ofType as GraphQLObjectType)
//         }
//       } else if (field && 'selectionSet' in field) {
//         return {
//           [selection.name.value]:
//             (selection.selectionSet?.selections ?? [])
//               .filter(isFieldNode)
//               .reduce((result, node) => ({
//                 ...result,
//                 [node.name.value]: node.selectionSet
//                   ? recurse(node, currentType)
//                   : node.name.value === '__typename' ? node.typeCondition.name.value : undefined
//               }), {})
//         }
//       }

//       return selection.name.value
//     }
//     if (isFragmentSpreadNode(selection)) {
//       const fragment = info.fragments[selection.name.value]
//       return recurse(fragment.selectionSet, typeMap[fragment.typeCondition.name.value] as GraphQLObjectType)
//     }
//   }
//   return (
//     info
//       .fieldNodes
//       .map(fieldNode =>
//         recurse(
//           fieldNode,
//           (info.returnType as GraphQLObjectType).getFields()[fieldNode.name.value]?.type as GraphQLObjectType
//         )
//       )
//   )
// }

// export const buildSelectionMap = (info: GraphQLResolveInfo, selection: SelectionSetNode) => {
//   return filterNonNodes(
//     selection
//       .selections
//       .reduce((result, node) => {
//         if (isFieldNode(node)) {
//           return {
//             ...result,
//             [node.name.value]:
//               node.selectionSet
//                 ? buildSelectionMap(info, node.selectionSet)
//                 : node.name.value === '__typename' ? node.typeCondition.name.value : undefined
//           }
//         }
    
//         if (isFragmentSpreadNode(node)) {
//           return {
//             ...result,
//             ...Object.fromEntries(
//               (info.fragments[node.name.value]?.selectionSet.selections ?? [])
//                 .filter(isFieldNode)
//                 .map(node => [
//                   node.name.value,
//                   node.selectionSet
//                     ? buildSelectionMap(info, node.selectionSet)
//                     : node.name.value === '__typename' ? node.typeCondition.name.value : undefined
//                 ])
//                 .filter(([key, value]) => value !== undefined)
//             )
//           }
//         }
    
//         return result
//       }, {})
//     )
// }

// export const buildSelectionMap = (info: GraphQLResolveInfo, selection: SelectionSetNode) => {
//   const fieldNodes = info.fieldNodes;
//   const returnType = info.returnType;

//   const result: GraphQLFieldNode = {};

//   function traverse(node: any, currentType: GraphQLNamedType, currentResult: GraphQLFieldNode) {
//     if (node.selectionSet) {
//       const fields = node.selectionSet.selections;
//       for (const field of fields) {
//         const fieldName = field.name.value;

//         if (currentType.ofType) {
//           if (currentType instanceof GraphQLList) {
//             currentResult[fieldName] = [
//               {
//                 __typename: currentType.ofType.name,
//                 ...traverse(field, currentType.ofType, {})
//               }
//             ]
//           }
//           if (currentType instanceof GraphQLNonNull) {
//             currentResult[fieldName] = {
//               __typename: currentType.ofType.name,
//               ...traverse(field, currentType.ofType, {})
//             }
//           }
//         } else {
//         console.log('currentType', fieldName, currentType)
//         const fieldType = currentType.getFields()[fieldName].type;
//           const namedType = fieldType.toJSON().name;
  
//           if (field.selectionSet) {
//             currentResult[fieldName] = {
//               __typename: namedType,
//               ...traverse(field, fieldType, {}),
//             };
//           } else {
//             currentResult[fieldName] = namedType;
//           }
//         }
//       }
//     }
//     return currentResult;
//   }

//   for (const fieldNode of fieldNodes) {
//     const operationName = fieldNode.name.value;
//     result[operationName] = traverse(fieldNode, returnType, {});
//   }

//   return result;
// }

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

// refactor: replace this with a simpler function, i was too lazy and chatgpt'd it lol
function mergeRelatedArrays(arrays) {
  const findArrayWithId = (id, excludeIndex) => {
      return arrays.findIndex((arr, index) => {
          if (index !== excludeIndex && arr.includes(id)) {
              return true
          }
          return false
      })
  }

  for (let i = 0; i < arrays.length; i++) {
      const currentArray = arrays[i]

      for (const id of currentArray) {
          const matchingArrayIndex = findArrayWithId(id, i)
          if (matchingArrayIndex !== -1) {
              arrays[i] = [...new Set([...currentArray, ...arrays[matchingArrayIndex]])]
              arrays.splice(matchingArrayIndex, 1)
              i = 0
              break
          }
      }
  }

  return arrays
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

  const handleGroups =
    groups
      .map((uris) => results.filter((handle) => uris.includes(handle.uri)))
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
