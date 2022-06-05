import { contramap, reverse } from 'fp-ts/Ord'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

export const byScore = pipe(
  N.Ord,
  contramap((p: { score: number }) => p.score),
  reverse
)