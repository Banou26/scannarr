import type { OriginWithServer, ServerContext } from './index'

import deepmerge from 'deepmerge'

import { fromScannarrUri, fromUri, isScannarrUri, populateHandle, toScannarrId } from '../utils/uri2'
import { YogaInitialContext } from 'graphql-yoga'
import { Handle, HandleRelation } from '../generated/graphql'
import { getEdges } from '../utils/handle'


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

export const groupRelatedHandles = <T extends Handle>({ typename, results: _results }: { typename: string, results: T[] }) => {
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
    handleGroups,
    scannarrHandles:
      handleGroups
        .map((handles) =>
          makeScannarrHandle({ typename, handles })
        )
  }
}

export const makeScannarrHandle = ({ typename, handles, readField }: { typename: string, handles: Handle[], readField?: ReadFieldFunction }) =>
  ({
    __typename: typename,
    origin: 'scannarr',
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

export const getOriginResults = async (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: OriginWithServer[], context?: () => Promise<ServerContext> }
) => {
  const rootUri = ctx.params.variables?.uri
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
              const promise = new Promise((res, rej) => {
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
                                  ...ctx.params.variables,
                                  uri,
                                  id: fromUri(uri).id,
                                  origin: fromUri(uri).origin
                                })
                                : ctx.params.variables
                          }),
                          headers: { 'Content-Type': 'application/json' }
                        }
                      ),
                      { ...await context?.(), server, results: resultPromises.map(({ promise }) => promise) }
                    ))()
                  .then(response => response.json())
              return {
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
  { ctx: YogaInitialContext, origins: OriginWithServer[], context?: () => Promise<ServerContext> }
) {
  const rootUri = ctx.params.variables?.uri
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
            const promise = new Promise((res, rej) => {
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
                                ...ctx.params.variables,
                                uri,
                                id: fromUri(uri).id,
                                origin: fromUri(uri).origin
                              })
                              : ctx.params.variables
                        }),
                        headers: { 'Content-Type': 'application/json' }
                      }
                    ),
                    { ...await context?.(), server, results: resultPromises.map(({ promise }) => promise) }
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
              promise,
              callResolver
            }
          })
      )

  const results = resultPromises.map(({ callResolver }) => callResolver())

  const promiseList = [...results]

  while (promiseList.length > 0) {
    const index = await Promise.race(promiseList.map((p, i) => p.then(() => i)));
    yield await promiseList[index]
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
