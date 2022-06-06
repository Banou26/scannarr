import { Observable, merge, scan, startWith } from 'rxjs'
import { map } from 'rxjs/operators'
import * as A from 'fp-ts/Array'
import * as S from 'fp-ts/string'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

import { fromUri } from './utils/uri'
import { byScore } from './utils'
import type { ExtraOptions, GetSeries, GetSeriesOptions, SearchSeries, SearchSeriesOptions } from './targets'
import { getTarget, getTargets } from './targets'
import { Series, SeriesHandle } from './types'

const seriesHandlesToSeries = (handles: SeriesHandle[]): Series => {
  return {
    categories: pipe(handles, A.map(handle => handle.categories), A.flatten),
    names: pipe(handles, A.map(handle => handle.names), A.flatten, A.sortBy([byScore])),
    dates: pipe(handles, A.map(handle => handle.dates), A.flatten),
    images: pipe(handles, A.map(handle => handle.images), A.flatten),
    synopses: pipe(handles, A.map(handle => handle.synopses), A.flatten),
    related: pipe(handles, A.map(handle => handle.related), A.flatten),
    handles,
    titles: pipe(handles, A.map(handle => handle.titles), A.flatten),
    recommended: pipe(handles, A.map(handle => handle.recommended), A.flatten),
    genres: [],
    uri: pipe(handles, A.map(handle => handle.uri)).join(','),
    uris: pipe(handles, A.map(handle => handle.uri))
  }
}

const get = async (options: GetSeriesOptions, extraOptions: ExtraOptions = { fetch }): Promise<Series | undefined> => {
  const { scheme, id } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  if (!target || !target.getSeries) return
  const results = await target.getSeries({ id, ...options }, extraOptions)
  if (!results) return
  const series = seriesHandlesToSeries([results])
  console.log('FOO', results)
  console.log('BAR', series)
  return series
  // return series
}

const search = (options: SearchSeriesOptions, extraOptions: ExtraOptions = { fetch }): Observable<Series[]> => {
  const targets = getTargets()
  return merge(
    ...targets
      .filter(target => target.searchSeries)
      .filter(target =>
        !target.categories ||
        !options.categories ||
        target.categories.some(category => options.categories?.includes(category))
      )
      .map(target => target.searchSeries!(options, extraOptions))
  ).pipe(
    startWith([]),
    scan((acc, result) => [...acc, ...result], [] as SeriesHandle[]),
    map(seriesHandles =>
      seriesHandles.map(handle => seriesHandlesToSeries([handle]))
    )
  )
}

export {
  get as getSeries,
  search as searchSeries
}
