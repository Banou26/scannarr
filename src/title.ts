import { Observable, merge, scan, startWith, map, tap, combineLatest, from, mergeMap } from 'rxjs'
import * as A from 'fp-ts/Array'
import { contramap, reverse } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import type { ExtraOptions, GetTitle, GetTitleOptions, SearchTitles, SearchTitlesOptions } from './targets'
import { getTarget, getTargets } from './targets'
import { Title, TitleHandle } from './types'
import { fromUri } from './utils/uri'
import { byScore } from './utils/sort'
import { findMostCommon } from './utils/find'

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


export const titleHandlesToTitle = (handles: TitleHandle[]): Title => {
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

const get = (options: GetTitleOptions, extraOptions: ExtraOptions = { fetch }): Observable<Title> => from((async () => {
  const { scheme } = 'uri' in options ? fromUri(options.uri) : options
  const target = getTarget(scheme)
  if (!target || !target.getTitle) return from([])
  const titleHandle = await target.getTitle(options, extraOptions)
  if (!titleHandle) return from([])
  return (
    titleHandle
      .pipe(
        map(titleHandle => titleHandlesToTitle([titleHandle]))
      )
  )
})()).pipe(mergeMap(observable => observable))

const search = <T extends SearchTitlesOptions>(options: T, extraOptions: ExtraOptions = { fetch }) => {
  console.log('searchTitles', options, extraOptions)
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
    tap(v => console.log('SEARCHTITLES TAP', v)),
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
