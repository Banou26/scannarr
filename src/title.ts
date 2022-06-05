import { merge, scan, startWith } from 'rxjs'
import { fromUri } from './utils/uri'
import { flatten, head, map, sortBy } from 'fp-ts/Array'
import { contramap, reverse } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import type { GetTitle, SearchTitles } from './targets'
import { getTarget, getTargets } from './targets'
import { Title, TitleHandle } from './types'
import { fromUri } from './utils/uri'
import { byScore } from './utils'

export const findMostCommon = <T>(arr: T[]): T => {
  const instances = [
    ...arr
      .reduce(
        (map, val) => map.set(val, (map.get(val) ?? 0) + 1),
        new Map()
      )
      .entries()
  ]
  const max = Math.max(...instances.map(([, instances]) => instances))
  return instances.filter(([, instances]) => instances === max).map(([num]) => num).at(0)
}


const titleHandlesToTitle = (handles: TitleHandle[]): Title => {
  return {
    uri: pipe(handles, map(handle => handle.uri)).join(','),
    uris: pipe(handles, map(handle => handle.uri)),
    unit: findMostCommon(pipe(handles, map(handle => handle.unit))),
    number: findMostCommon(pipe(handles, map(handle => handle.number))),
    names: pipe(handles, map(handle => handle.names), flatten, sortBy([byScore])),
    images: pipe(handles, map(handle => handle.images), flatten),
    dates: pipe(handles, map(handle => handle.dates), flatten),
    synopses: pipe(handles, map(handle => handle.synopses), flatten),
    tags: pipe(handles, map(handle => handle.tags), flatten),
    handles,
    categories: pipe(handles, map(handle => handle.categories), flatten),
    related: pipe(handles, map(handle => handle.related), flatten),
    recommended: pipe(handles, map(handle => handle.recommended), flatten)
  }
}

const get: GetTitle = async (options, extraOptions) => {
  const { scheme } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  if (!target || !target.getTitles) return
  const title = await target.getTitles(options, extraOptions)
  if (!title) return undefined
  return titleHandlesToTitle([title])
}

const search: SearchTitles = (options, extraOptions) => {
  const targets = getTargets()

  return merge(
    ...targets
      .filter(target => target.searchTitles)
      .map(target => target.searchTitles!(options, extraOptions))
  ).pipe(
    startWith([]),
    scan((acc, result) => [...acc, ...result], [] as TitleHandle[])
  )
}

export {
  get as getTitle,
  search as searchTitles
}
