import { Observable, merge, scan, startWith, map, tap, combineLatest, from, mergeMap, catchError } from 'rxjs'
import * as A from 'fp-ts/Array'
import * as S from 'fp-ts/String'
import { contramap, reverse } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import type { ExtraOptions, GetTitle, GetTitleOptions, SearchTitles, SearchTitlesOptions } from './targets'
import { getTarget, getTargets } from './targets'
import { Category, Title, TitleHandle } from './types'
import { fromUri } from './utils/uri'
import { byScore } from './utils/sort'
import { findMostCommon } from './utils/find'
import { HandleEq } from './utils/handle'

export const titleHandlesToTitle = (handles: TitleHandle[]): Title => {

  const flatHandles =
    A.uniq<TitleHandle>(HandleEq)([
      ...handles,
      ...handles.flatMap(handle => handle.handles ?? [])
    ])

  // todo: add series property
  return {
    categories: pipe(handles, A.map(handle => handle.categories), A.flatten, A.uniq(S.Eq)) as Category[],
    dates: pipe(handles, A.map(handle => handle.dates), A.flatten),
    handles: flatHandles,
    images: pipe(handles, A.map(handle => handle.images), A.flatten),
    names: pipe(handles, A.map(handle => handle.names), A.flatten, A.sortBy([byScore])),
    number: findMostCommon(pipe(handles, A.map(handle => handle.number))),
    recommendations:
      pipe(
        handles,
        A.map(handle => handle.recommendations),
        A.flatten,
        A.map(handle => titleHandlesToTitle([handle]))
      ),
    relations:
      pipe(
        handles,
        A.map(handle => handle.relations),
        A.flatten,
        A.map(relation => ({
          ...relation,
          reference: titleHandlesToTitle([relation.reference])
        }))
      ),
    synopses: pipe(handles, A.map(handle => handle.synopses), A.flatten),
    unit: findMostCommon(pipe(handles, A.map(handle => handle.unit))),
    uri: pipe(handles, A.map(handle => handle.uri)).join(','),
    uris: pipe(handles, A.map(handle => handle.uri))
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
  const targets = getTargets()
  return combineLatest(
    targets
      .filter(target =>
        !target.categories ||
        !options.categories ||
        target.categories.some(category => options.categories?.includes(category))
      )
      .filter(target => target.searchTitles)
      .map(target =>
        target
          .searchTitles!(options, extraOptions)
          .pipe(
            catchError(err => {
              console.error(err)
              throw err
            }),
            startWith([])
          )
      )
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
