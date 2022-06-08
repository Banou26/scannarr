import { Observable, merge, scan, startWith, map, tap, combineLatest } from 'rxjs'
import * as A from 'fp-ts/Array'
import { contramap, reverse } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import type { ExtraOptions, GetTitle, GetTitleOptions, SearchTitles, SearchTitlesOptions } from './targets'
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

// pipe(
//   users,
//   sort((a, b) => a.name.localeCompare(b.name)),
//   maximumBy(u => u.id),
//   head
// )();

// const commonItem = pipe(
//   array,
//   A.groupBy(x => x),
//   A.map(arr => ({ item: arr[0], count: arr.length })),
//   A.sort((x, y) => y.count - x.count),
//   A.head
// ).fold(
//   () => none,
//   x => some(x.item)
// );


const titleHandlesToTitle = (handles: TitleHandle[]): Title => {
  return {
    uri: pipe(handles, A.map(handle => handle.uri)).join(','),
    uris: pipe(handles, A.map(handle => handle.uri)),
    unit: findMostCommon(pipe(handles, A.map(handle => handle.unit))),
    number: findMostCommon(pipe(handles, A.map(handle => handle.number))),
    names: pipe(handles, A.map(handle => handle.names), A.flatten, A.sortBy([byScore])),
    images: pipe(handles, A.map(handle => handle.images), A.flatten),
    dates: pipe(handles, A.map(handle => handle.dates), A.flatten),
    synopses: pipe(handles, A.map(handle => handle.synopses), A.flatten),
    handles,
    categories: pipe(handles, A.map(handle => handle.categories), A.flatten),
    related: pipe(handles, A.map(handle => handle.related), A.flatten),
    recommended: pipe(handles, A.map(handle => handle.recommended), A.flatten)
  }
}

const get = async (options: GetTitleOptions, extraOptions: ExtraOptions = { fetch }): Promise<Title | undefined> => {
  const { scheme } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  if (!target || !target.getTitles) return
  const title = await target.getTitles(options, extraOptions)
  if (!title) return undefined
  return titleHandlesToTitle([title])
}

const search = <T extends SearchTitlesOptions>(options: T, extraOptions: ExtraOptions = { fetch }) => {
  const targets = getTargets()
  return combineLatest(
    targets
      .filter(target =>
        !target.categories ||
        !options.categories ||
        target.categories.some(category => options.categories?.includes(category))
      )
      .filter(target => target.searchTitles)
      .map(target => target.searchTitles!(options, extraOptions))
  ).pipe(
    startWith([]),
    map(titleHandles => (
      'search' in options && typeof options.search !== 'string'
        ? titleHandlesToTitle(titleHandles.flat())
        : titleHandles.flat().map(handle => titleHandlesToTitle([handle]))
    ) as T extends { search: Title } ? Title : Title[])
  )
}

export {
  get as getTitle,
  search as searchTitles
}
