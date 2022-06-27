import * as A from 'fp-ts/Array'
import * as R from 'fp-ts/Record'
import { pipe } from 'fp-ts/function'
import { groupBy } from 'fp-ts/lib/NonEmptyArray'

import { Handle } from '../types'

// todo: replace this with a graph data structure
export const groupHandles = <T extends Handle>(values: T[]): { groups: [string, T[]][], singles: T[] } => {
  const handlesMap =
    pipe(
      values,
      groupBy(handle => handle.uri)
    )
  console.log('values', values.flat())

  const groupedHandlesMap =
    pipe(
      handlesMap,
      R.toEntries,
      A.map(([uri, [handle]]) => [
        uri,
        [
          handle,
          ...values
            .flat()
            .filter(handle =>
              handle.handles?.some(({ uri: innerUri }) => uri === innerUri)
            )
        ]
      ] as [string, T[]]),
      A.filter(([, arr]) => arr.length > 1),
      R.fromEntries
    )

  const groupedHandleSet =
    pipe(
      groupedHandlesMap,
      R.toEntries,
      A.map(([, handles]) => handles),
      A.flatten,
      A.map(handle => handle.uri)
    )

  const groupedHandles =
    pipe(
      groupedHandlesMap,
      R.toEntries
    )

  const singleHandles =
    pipe(
      values,
      A.filter(handle => !groupedHandleSet.includes(handle.uri))
    )
    
  console.log('groupedHandles', groupedHandles)
  console.log('singleHandles', singleHandles)

  return {
    groups: groupedHandles,
    singles: singleHandles
  }
}

export const HandleEq = {
  equals: (handle: Handle, handle2: Handle) => handle.uri === handle2.uri
}

