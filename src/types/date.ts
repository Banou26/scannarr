
export type ReleaseData = {
  language: string
  date: Date
}

export type AiringData = {
  language: string
  start: Date
  end?: Date
}

export type DateData = ReleaseData | AiringData

export default DateData
