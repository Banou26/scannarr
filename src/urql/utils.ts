import deepmerge from 'deepmerge'

import { fromScannarrUri, fromUri, isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri'
import { YogaInitialContext } from 'graphql-yoga'
import { Handle, HandleRelation } from '../generated/graphql'
import { getEdges } from '../utils/handle'
import { ServerContext } from './client'
import { HandleType } from './server'
import { groupBy, merge } from '../utils'

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

  const handleGroups = groups.map((uris) => results.filter((handle) => uris.includes(handle.uri)))

  return {
    groups,
    handleGroups
  }
}

const recursiveRemoveNullable = <T>(obj: T): T =>
  (
    Array.isArray(obj)
      ? obj.map(recursiveRemoveNullable)
      : (
        typeof obj === 'object'
          ? (
            Object
              .fromEntries(
                Object
                  .entries(obj as Object)
                  .filter(([_, value]) => value !== null && value !== undefined)
                  .map(([key, value]) => [key, recursiveRemoveNullable(value)])
              )
          )
          : obj
      )
  ) as unknown as T

export const makeScannarrHandle2 = ({ handles, mergeHandles }: { handles: HandleType[], mergeHandles: <T2 extends HandleType[]>(handles: T2) => T2[number] }) => {
  const getRecursiveHandles = (handle: HandleType): HandleType[] => {
    const identicalHandles = getEdges(handle.handles) ?? []
    return [
      handle,
      ...identicalHandles.flatMap(handle => getRecursiveHandles(handle.node))
    ]
  }

  const foundHandles = handles.flatMap(handle => getRecursiveHandles(handle))
  const uniqueHandles =
    [...groupBy(foundHandles, (handle) => handle.uri) as Map<string, HandleType[]>]
      .map(([_, handles]) => merge(...recursiveRemoveNullable(handles)) as HandleType)
  const handleUris = uniqueHandles.map(handle => handle.uri)
  const id = toScannarrId(handleUris)
  const uri = toScannarrUri(handleUris)

  return ({
    ...mergeHandles(uniqueHandles),
    origin: 'scannarr',
    id,
    uri,
    url: null,
    handles: {
      edges: uniqueHandles.map((handle) => ({
        handleRelationType: HandleRelation.Identical,
        node: handle
      })),
      nodes: uniqueHandles
    }
  })
}

export const makeScannarrHandle = ({ typename, handles, readField }: { typename: string, handles: Handle[], readField?: any }) => {
  const getRecursiveHandles = (handle: Handle) => {
    const identicalHandles = getEdges(handle.handles) ?? []
    return [
      handle,
      ...identicalHandles.flatMap(handle => getRecursiveHandles(handle.node))
    ]
  }

  const handleUris = handles.flatMap(handle => getRecursiveHandles(handle)).map(handle => handle.uri)
  const id = toScannarrId(handleUris)
  const uri = toScannarrId(handleUris)

  const res = ({
    __typename: typename,
    origin: 'scannarr',
    // id,
    // uri,
    id: '()',
    uri: 'scannarr:()',
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

  // console.log('makeScannarrHandle', res, handles)
  
  return res
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
