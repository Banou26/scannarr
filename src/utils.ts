import type { Handle } from './types/handle'

import { contramap, reverse } from 'fp-ts/Ord'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

export type Uri = `${string}:${string}`

export const fromUri = (uri: Uri) => {
  const [scheme, id] = uri.split(':')
  return { scheme: scheme!, id: id! }
}

export const toUri = ({ scheme, id }: { scheme: string, id: string }): Uri => `${scheme}:${id}`

export const populateUri = <T extends Partial<Pick<Handle, 'uri'>> & Omit<Handle, 'uri'>>(handle: T): T & Handle => ({
  ...handle,
  uri: toUri({ scheme: handle.scheme, id: handle.id })
})

export const byScore = pipe(
  N.Ord,
  contramap((p: { score: number }) => p.score),
  reverse
)