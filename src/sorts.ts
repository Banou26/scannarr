import { Media, MediaSort } from './generated/graphql'

const numberSort = (a: number, b: number) => b - a
const reverseNumberSort = (a: number, b: number) => a - b
const dateSort = (a: Date, b: Date) => b.getTime() - a.getTime()
const reverseDateSort = (a: Date, b: Date) => a.getTime() - b.getTime()
const alphabeticalSort = (a: string, b: string) => b.localeCompare(a)
const reverseAlphabeticalSort = (a: string, b: string) => a.localeCompare(b)

const MediaSorts = {
  [MediaSort.Id]: (media: Media, media2: Media) => alphabeticalSort(media.id, media2.id),
  [MediaSort.IdDesc]: (media: Media, media2: Media) => reverseNumberSort(media.id, media2.id),
  // [MediaSort.Title]: (media: Media, media2: Media) => alphabeticalSort(media.title, media2.title),
  // [MediaSort.TitleDesc]: (media: Media, media2: Media) => reverseAlphabeticalSort(media.title, media2.title),
  [MediaSort.StartDate]: (media: Media, media2: Media) => dateSort(media.startDate, media2.startDate),
  [MediaSort.StartDateDesc]: (media: Media, media2: Media) => reverseDateSort(media.startDate, media2.startDate),
  [MediaSort.EndDate]: (media: Media, media2: Media) => dateSort(media.endDate, media2.endDate),
  [MediaSort.EndDateDesc]: (media: Media, media2: Media) => reverseDateSort(media.endDate, media2.endDate),
  [MediaSort.Score]: (media: Media, media2: Media) => numberSort(media.score, media2.score),
  [MediaSort.ScoreDesc]: (media: Media, media2: Media) => reverseNumberSort(media.score, media2.score),
  [MediaSort.Popularity]: (media: Media, media2: Media, { readField }) => numberSort(readField('popularity', media), readField('popularity', media2)),
  [MediaSort.PopularityDesc]: (media: Media, media2: Media, { readField }) => reverseNumberSort(readField('popularity', media), readField('popularity', media2)),
  [MediaSort.Type]: (media: Media, media2: Media) => alphabeticalSort(media.type, media2.type),
  [MediaSort.TypeDesc]: (media: Media, media2: Media) => reverseAlphabeticalSort(media.type, media2.type),
  [MediaSort.Format]: (media: Media, media2: Media) => alphabeticalSort(media.format, media2.format),
  [MediaSort.FormatDesc]: (media: Media, media2: Media) => reverseAlphabeticalSort(media.format, media2.format),
  [MediaSort.Status]: (media: Media, media2: Media) => alphabeticalSort(media.status, media2.status),
  [MediaSort.StatusDesc]: (media: Media, media2: Media) => reverseAlphabeticalSort(media.status, media2.status),
} as const

export const Sorts = {
  ...MediaSorts,
} as const
