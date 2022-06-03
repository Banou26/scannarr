export type ReleaseDate = {
  language: string
  date: Date
}

export type AiringData = {
  language: string
  start: Date
  end?: Date
}

export type DateData = ReleaseDate | AiringData

export default DateData
