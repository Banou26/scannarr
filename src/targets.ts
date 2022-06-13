import type { Observable } from 'rxjs'
import type { Uri } from './utils'
import type { Category, FetchType, Genre, Series, SeriesHandle, Title, TitleHandle } from './types'

export type ExtraOptions = {
  fetch: FetchType
}

export type GetOptions = {
  uri: Uri
} | {
  scheme: string
  id: string
}

export type GetSeriesOptions = {

} & GetOptions

export type GetTitleOptions = (
  {
    seriesUri?: Uri
  } | {
    seriesId?: string
  }
) & GetOptions

export type GetSeries = (options: GetSeriesOptions, extraOptions: ExtraOptions) => Observable<SeriesHandle>
export type GetTitle = (options: GetTitleOptions, extraOptions: ExtraOptions) => Observable<TitleHandle>

export type SearchLatestOptions = {
  latest?: boolean
}

export type BaseSearchOptions = {
  scheme?: string
  categories?: Category[]
  genres?: Genre[]
  /** Certainty score of the result */
  score?: number
  // todo: check for a generalized way to handle pagination
  pagination?: number
}

export type SearchSeriesOptions = ({
  search: string | Series
} | SearchLatestOptions) & BaseSearchOptions

export type SearchTitlesOptions = (({
  series: Series
} | {
  series?: Series
  search: string | Title
}) | SearchLatestOptions) & BaseSearchOptions

export type SearchSeries = (options: SearchSeriesOptions, extraOptions: ExtraOptions) => Observable<SeriesHandle[]>
export type SearchTitles = (options: SearchTitlesOptions, extraOptions: ExtraOptions) => Observable<TitleHandle[]>

export type Target = {
  /** Origin URL, e.g: https://example.com/ */
  origin: string

  categories: Category[]
  /** Name of the target, e.g: Example */
  name: string
  /** Preferably short, unique scheme used to identify resources, e.g: exmpl */
  scheme: string
  /** Test function that should verify that the external resource hasn't made breaking changes */
  test?: () => Promise<void>

  getSeries?: GetSeries
  getTitle?: GetTitle

  searchSeries?: SearchSeries
  searchTitles?: SearchTitles
}

export const targets = new Map<string, Target>()

export const getTargets = () => [...targets.values()]
export const getTarget = (target: string | Target) => targets.get(typeof target === 'string' ? target : target.scheme)
export const addTarget = (target: Target) => targets.set(target.scheme, target)
export const removeTarget = (target: Target) => targets.delete(target.scheme)
