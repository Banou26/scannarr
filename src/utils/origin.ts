import type { OriginCtx, ServerContext } from '../urql/server'

import { combineLatest, from } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { gql } from 'graphql-tag'
import { Handle, SubscriptionResolverObject, SubscriptionResolvers } from '../generated/graphql'
import { makeScannarrHandle2 } from '../urql'

type SubscriptionResolverValue<T extends keyof SubscriptionResolvers> =
  Extract<
      Awaited<
        ReturnType<
          ReturnType<
            Awaited<
              ReturnType<
                Exclude<
                  ReturnType<
                    Extract<
                      SubscriptionResolvers[T],
                      Function
                    >
                  >,
                  SubscriptionResolverObject<any, any, any, any>
                >['subscribe']
              >
            >[typeof Symbol['asyncIterator']]
          >['next']
        >
      >,
      IteratorYieldResult<any>
    >['value']

// todo: check why this isnt valid, probably some TS dark magic
// @ts-expect-error
type SubscriptionResolverInnerValue<T extends keyof SubscriptionResolvers> = SubscriptionResolverValue<T>[T]

type SubscriptionResolverHandleValue<T extends keyof SubscriptionResolvers> = Awaited<SubscriptionResolverInnerValue<T>>

export const subscribeToOrigins = <T extends keyof SubscriptionResolvers>(
  { name, context, origins }:
  { name: T, context: ServerContext, origins: OriginCtx[] }
) =>
  combineLatest(
    ...origins
      .map(origin =>
        from(
          origin
            .client
              .subscription<SubscriptionResolverValue<T>>(
                gql([context.params.query]),
                context.params.variables
              )
        )
        .pipe(
          map(result =>
            result.error?.message === '[Network] No Content'
              ? { ...result, data: { [name]: null } as { [K in T]: null }, error: undefined, origin }
              : { ...result, origin }
          ),
          tap(result => {
            if (result.error) {
              console.warn('Error in origin', result.origin.origin.name)
              console.error(result.error)
            }
          })
        )
      )
  )

export const mergeOriginSubscriptionResults = <T extends keyof SubscriptionResolvers>(
  { name, results, mergeHandles }:
  { name: T, results: ReturnType<typeof subscribeToOrigins>, mergeHandles: <T2 extends Handle[]>(handles: T2) => T2[number] }
) =>
  results
    .pipe(
      map(_results => {
        const resultsData =
          _results
            .map(result => result.data)
            .filter((data) => Boolean(data))
            .filter(data => Boolean(data?.[name as keyof typeof data]))
        if (!resultsData.length) return

        return {
          [name]:
            makeScannarrHandle2({
              handles:
                resultsData
                  .map(data => data![name as keyof typeof data]),
              mergeHandles
            })
        } as unknown as { [K in T]: SubscriptionResolverHandleValue<K> }
      })
    )
