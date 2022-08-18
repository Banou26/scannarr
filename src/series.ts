import { Observable, startWith, combineLatest, from, mergeMap } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import * as A from 'fp-ts/Array'
import * as S from 'fp-ts/String'
import * as N from 'fp-ts/Number'
import { pipe } from 'fp-ts/function'
import { toUndefined } from 'fp-ts/lib/Option'

import { fromUri } from './utils/uri'
import { byScore } from './utils/sort'
import type { ExtraOptions, GetSeriesOptions, SearchSeriesOptions } from './targets'
import { getTarget, getTargets } from './targets'
import { Category, GenreHandle, Series, SeriesHandle } from './types'
import { titleHandlesToTitle } from './title'
import { findMostCommon } from './utils/find'
import { GenreEq, NameEq } from './utils/equal'
import { groupHandles, HandleEq } from './utils/handle'

const seriesHandlesToSeries = (handles: SeriesHandle[]): Series => {
  const scores =
    pipe(
      handles,
      A.map(handle => handle.averageScore),
      A.filter(Boolean)
    )

  const airingSchedule = pipe(
    handles,
    A.map(handle => handle.airingSchedule),
    A.flatten,
    A.filter(airingSchedule => !isNaN(Number(airingSchedule.date)))
  )
  // const airingSchedule = findMostCommon(pipe(handles, A.map(handle => handle.airingSchedule)))

  const flatHandles =
    A.uniq<SeriesHandle>(HandleEq)([
      ...handles,
      ...handles.flatMap(handle => handle.handles ?? [])
    ])

  return {
    airingSchedule: airingSchedule?.length ? airingSchedule : undefined,
    averageScore:
      scores.length
        ? (
          pipe(
            scores,
            A.reduce(0, (acc, score: number) => acc + score)
          ) / handles.length
        )
        : undefined,
    categories: pipe(handles, A.map(handle => handle.categories), A.flatten, A.uniq(S.Eq)) as Category[],
    countryOfOrigin: findMostCommon(pipe(handles, A.map(handle => handle.countryOfOrigin))),
    dates: pipe(
      handles,
      A.map(handle => handle.dates),
      A.flatten,
      A.filter(dateData =>
        !isNaN(Number(
          'date' in dateData
            ? dateData.date
            : dateData.start
        ))
      )
    ),
    duration: findMostCommon(pipe(handles, A.map(handle => handle.duration))),
    externalLinks: pipe(handles, A.map(handle => handle.externalLinks), A.flatten),
    format: findMostCommon(pipe(handles, A.map(handle => handle.format))),
    genres: pipe(handles, A.map(handle => handle.genres), A.flatten, A.uniq(GenreEq)) as GenreHandle[],
    handles: flatHandles,
    images: pipe(handles, A.map(handle => handle.images), A.flatten),
    isAdult: findMostCommon(pipe(handles, A.map(handle => handle.isAdult))),
    // todo: think about keeping the score of removed duplicate names
    names: pipe(handles, A.map(handle => handle.names), A.flatten, A.uniq(NameEq), A.sortBy([byScore])),
    popularity: pipe(handles, A.map(handle => handle.popularity), A.filter(Boolean), A.sort(N.Ord), A.head, toUndefined),
    recommendations:
      pipe(
        handles,
        A.map(handle => handle.recommendations),
        A.flatten,
        A.map(handle => seriesHandlesToSeries([handle]))
      ),
    relations:
      pipe(
        handles,
        A.map(handle => handle.relations),
        A.flatten,
        A.map(relation => ({
          ...relation,
          reference: seriesHandlesToSeries([relation.reference])
        }))
      ),
    source: findMostCommon(pipe(handles, A.map(handle => handle.source))),
    status: findMostCommon(pipe(handles, A.map(handle => handle.status))),
    synopses: pipe(handles, A.map(handle => handle.synopses), A.flatten),
    tags: pipe(handles, A.map(handle => handle.tags), A.flatten),
    titleNumbers: findMostCommon(pipe(handles, A.map(handle => handle.titleNumbers))),
    titles: pipe(handles, A.map(handle => handle.titles), A.flatten, A.map(handle => titleHandlesToTitle([handle]))),
    unit: findMostCommon(pipe(handles, A.map(handle => handle.unit))),
    uri: pipe(handles, A.map(handle => handle.uri)).join(','),
    uris: pipe(handles, A.map(handle => handle.uri))
  }
}

const get = (options: GetSeriesOptions, extraOptions: ExtraOptions = { fetch }): Observable<Series> => from((async () => {
  console.log('getSeries', options, extraOptions)
  const { scheme, id } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  if (!target || !target.getSeries) return from([])
  const results = target.getSeries({ id, ...options }, extraOptions)
  if (!results) return from([])
  return (
    results
      .pipe(
        map(series => seriesHandlesToSeries([series]))
      )
  )
})()).pipe(mergeMap(observable => observable))

const search = (options: SearchSeriesOptions, extraOptions: ExtraOptions = { fetch }): Observable<Series[]> => {
  const targets = getTargets()

  return combineLatest(
    targets
      .filter(target => target.searchSeries)
      .filter(target =>
        !target.categories ||
        !options.categories ||
        target.categories.some(category => options.categories?.includes(category))
      )
      .map(target =>
        target
          .searchSeries!(options, extraOptions)
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
    map(values => {
      const { groups, singles } = groupHandles(values.flat())
      return [
        ...singles.map(handle => seriesHandlesToSeries([handle])),
        ...groups.map(([, handles]) => seriesHandlesToSeries(handles))
      ]
    })
  )
}

export {
  get as getSeries,
  search as searchSeries
}
