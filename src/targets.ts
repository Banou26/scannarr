import type { Observable } from 'rxjs'
import type { Uri } from './utils/uri'
import type { Category, FetchType, Genre, Series, SeriesHandle, Title, TitleHandle } from './types'

export type ExtraOptions = {
  fetch: FetchType
}

export type GetOptions = {
  uri: Uri
} | {
  id: string
  scheme: string
}

export type GetSeriesOptions = GetOptions

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
  categories?: Category[]
  genres?: Genre[]
  // todo: check for a generalized way to handle pagination
  pagination?: number
  scheme?: string
  /** Certainty score of the result */
  score?: number
}

export type SearchSeriesOptions = ({
  search: string | Series
} | SearchLatestOptions) & BaseSearchOptions

export type SearchTitlesOptions = (({
  series: Series
} | {
  search: string | Title
  series?: Series
}) | SearchLatestOptions) & BaseSearchOptions

export type SearchSeries = (options: SearchSeriesOptions, extraOptions: ExtraOptions) => Observable<SeriesHandle[]>
export type SearchTitles = (options: SearchTitlesOptions, extraOptions: ExtraOptions) => Observable<TitleHandle[]>

export type Target = {
  categories: Category[]

  getSeries?: GetSeries
  getTitle?: GetTitle

  /** Icon URL of the target, e.g: https://example.com/favicon.svg */
  icon?: string

  /** Name of the target, e.g: Example */
  name: string

  /** Origin URL, e.g: https://example.com/ */
  origin: string

  /** Preferably short, unique scheme used to identify resources, e.g: exmpl */
  scheme: string

  searchSeries?: SearchSeries
  searchTitles?: SearchTitles

  /** Test function that should verify that the external resource hasn't made breaking changes */
  test?: () => Promise<void>
}

export const targets = new Map<string, Target>()

export const getTargets = () => [...targets.values()]
export const getTarget = (target: string | Target) => targets.get(typeof target === 'string' ? target : target.scheme)
export const addTarget = (target: Target) => targets.set(target.scheme, target)
export const removeTarget = (target: Target) => targets.delete(target.scheme)
