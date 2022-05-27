import type { Observable } from 'rxjs'
import type { Category, Genre, SeriesHandle, TitleHandle } from './types'

export type GetOptions = {
  uri: string
} | {
  scheme: string
  id: string
}

export type GetSeriesOptions = {

} & GetOptions

export type GetTitleOptions = (
  {
    seriesUri: string
  } | {
    seriesId: string
  }
) & GetOptions

export type GetSeries = (options: GetSeriesOptions) => Promise<SeriesHandle>
export type GetTitle = (options: GetTitleOptions) => Promise<TitleHandle>

export type SearchLatestOptions = {
  latest?: boolean
}

export type SearchOptions = {
  search: string
  scheme?: string
  categories?: Category[]
  genres?: Genre[]
  /** Certainty score of the result */
  score?: number
  // todo: check for a generalized way to handle pagination
  pagination?: number
} & SearchLatestOptions

export type SearchSeriesOptions = {
  search: string | SeriesHandle
} & SearchOptions

export type SearchTitlesOptions = {
  series?: SeriesHandle
  search: string | TitleHandle
} & SearchOptions

export type SearchSeries = (options: SearchSeriesOptions) => Observable<SeriesHandle[]>
export type SearchTitles = (options: SearchTitlesOptions) => Observable<TitleHandle[]>

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
  getTitles?: GetTitle

  searchSeries?: SearchSeries
  searchTitles?: SearchTitles
}

export const targets = new Map<string, Target>()

export const getTargets = () => [...targets.values()]
export const getTarget = (target: string | Target) => targets.get(typeof target === 'string' ? target : target.scheme)
export const setTarget = (target: Target) => targets.set(target.scheme, target)
export const removeTarget = (target: Target) => targets.delete(target.scheme)
