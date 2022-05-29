import { Observable, merge, scan, startWith } from 'rxjs'
import type { GetSeries, SearchSeries } from './targets'
import { getTarget, getTargets } from './targets'
import { SeriesHandle } from './types'
import { fromUri } from './utils/uri'

const get: GetSeries = async (options) => {
  const { scheme } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  if (!target || !target.getSeries) return
  return target.getSeries(options)
}

const search: SearchSeries = (options) => {
  const targets = getTargets()
  return merge(
    ...targets
      .filter(target => target.searchSeries)
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
