import type { Handle } from './handle'
import type { Relation } from './relation'
import type { HandleTypeToType } from './utils'
import type Category from './category'
import type Name from './name'
import type ImageData from './image'
import type Synopsis from './synopsis'
import type DateData from './date'
import type Tag from './tag'


export type TitleType = 'iframe' | 'torrent' | 'custom'
export type TitleRelation = 'previous' | 'next'

export type Title =
  HandleTypeToType<
    TitleHandle,
    'season' | 'number' | 'names' | 'images' |
    'dates' | 'synopses' | 'tags' | 'number',
    {
      categories: (Handle & { category: Category })[]
      related: Relation<Title>[]
    }
  >

export type TitleHandle =
  Handle & {
    season?: number
    number: number
    names: Name[]
    images: ImageData[]
    dates: DateData[]
    synopses: Synopsis[]
    tags: Tag[]
    handles: TitleHandle[]
    categories: Category[]
    related: Relation<TitleHandle>[]
    size?: number
  }


// https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes
// export type Title = {
//   series: Series
//   id: string
//   size: number
//   category: Category
//   files: File
//   poster: User
//   // group
//   team: Team
//   downloads: number
//   // password
//   // comments
//   date: Date
//   // usenetdate
//   // nfo
//   // info
//   year: number
//   season: number
//   Title: number
//   // rageid
//   // tvtitle
//   // tvairdate
//   video: string
//   audio: string
//   resolution: string
//   framerate: string
//   language: string
//   subs: string[]
//   // imdb
//   // imdbscore
//   // imdbtitle
//   // imdbtagline
//   // imdbplot
//   // imdbyear
//   // imdbdirector
//   // imdbactors
//   genre: Genre
//   // artist
//   // album
//   publisher
//   // tracks
//   // coverurl
//   // backdropcoverurl
//   // review
//   // booktitle
//   // publishdate
//   // author
//   // pages
// }
