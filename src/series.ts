import { Observable, merge, scan, startWith } from 'rxjs'
import type { GetSeries, SearchSeries } from './targets'
import { getTarget, getTargets } from './targets'
import { Series, SeriesHandle, SeriesHandle } from './types'
import { fromUri } from './utils/uri'
import { flatten, head, map, sortBy } from 'fp-ts/Array'
import { contramap, reverse } from 'fp-ts/Ord'
import * as S from 'fp-ts/string'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

const byScore = pipe(
  N.Ord,
  contramap((p: { score: number }) => p.score),
  reverse
)

const seriesHandleToSeries = (handles: SeriesHandle[]): Series => {
  return {
    categories: pipe(handles, map(handle => handle.categories), flatten),
    names: pipe(handles, map(handle => handle.names), flatten, sortBy([byScore])),
    dates: pipe(handles, map(handle => handle.dates), flatten),
    images: pipe(handles, map(handle => handle.images), flatten),
    synopses: pipe(handles, map(handle => handle.synopses), flatten),
    related: pipe(handles, map(handle => handle.related), flatten),
    handles,
    titles: pipe(handles, map(handle => handle.titles), flatten),
    recommended: pipe(handles, map(handle => handle.recommended), flatten),
    tags: pipe(handles, map(handle => handle.tags), flatten),
    genres: [],
    uri: pipe(handles, map(handle => handle.uri)).join(','),
    uris: pipe(handles, map(handle => handle.uri))
  }
}

const get: GetSeries = async (options, extraOptions) => {
  const { scheme, id } = 'uri' in options ? fromUri(options.uri) : options
  console.log('get series', scheme)
  const target = await getTarget(scheme)
  console.log('target', target)
  if (!target || !target.getSeries) return
  const results = await target.getSeries({ id, ...options }, extraOptions)
  console.log('results', results)
  if (!results) return
  const series = seriesHandleToSeries([results])
  console.log('series', series)
  return results
}

const search: SearchSeries = (options) => {
  const targets = getTargets()
  return merge(
    ...targets
      .filter(target => target.searchSeries)
      .filter(target =>
        !target.categories ||
        !options.categories ||
        target.categories.some(category => options.categories?.includes(category))
      )
      .map(target => target.searchSeries!(options))
  ).pipe(
    startWith([]),
    scan((acc, result) => [...acc, ...result], [] as SeriesHandle[])
  )
}

export {
  get as getSeries,
  search as searchSeries
}
