import type { OriginWithServer, ServerContext } from './index'

import deepmerge from 'deepmerge'

import { fromScannarrUri, fromUri, isScannarrUri } from '../utils/uri2'
import { YogaInitialContext } from 'graphql-yoga'


export async function *getOriginResultsStreamed (
  { ctx, origins, context }:
  { ctx: YogaInitialContext, origins: OriginWithServer[], context?: () => Promise<ServerContext> }
) {
  const rootUri = ctx.params.variables?.uri
  const uris =
    rootUri && isScannarrUri(rootUri)
      ? fromScannarrUri(rootUri)?.handleUris
      : undefined

  const results =
    (uris ?? [undefined])
      .flatMap(uri =>
        origins
          .filter(({ origin }) => uri ? origin.supportedUris?.includes(fromUri(uri).origin) : true)
          .map(async ({ origin, server }) =>
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
                  { ...await context?.(), server }
                ))()
              .then(response => response.json())
              .then(result => ({
                ...result,
                origin,
              }))
              .catch(err => {
                const error = new Error(`Error in origin for ${origin.name}:\n${err.message}`)
                error.stack = `Error in origin for ${origin.name}:\n${err.stack}`
                console.error(error)
                throw err
              })
          )
      )

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
