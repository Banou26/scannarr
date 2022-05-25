import type { Handle } from './handle'
import type { Relation } from './relation'
import type { Title, TitleHandle } from './title'
import type { HandleTypeToType } from './utils'
import type { GenreHandle } from './genre'
import type Category from './category'
import type DateData from './date'
import type Image from './image'
import type Name from './name'
import type Synopsis from './synopsis'
import type Tag from './tag'

export type SeriesRelation = 'spinoff' | 'adaptation' | 'prequel' | 'sequel'

export type Series =
  HandleTypeToType<
    SeriesHandle,
    'names' | 'dates' | 'images' | 'synopses' |
    'related' | 'recommended' | 'tags' | 'genres',
    {
      categories: (Handle & { category: Category })[]
      related: Relation<Series>[]
      titles: Title[]
    }
  >

export type SeriesHandle =
  Handle & {
    categories: Category[]
    names: Name[]
    dates: DateData[]
    images: Image[]
    synopses: Synopsis[]
    related: Relation<SeriesHandle>[]
    handles: SeriesHandle[]
    titles: TitleHandle[]
    recommended: SeriesHandle[]
    tags: Tag[]
    genres: GenreHandle[]
  }

// https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes
// export type Series = {
//   titles: Title[]
//   id: string
//   category: Category
//   date: Date
//   language: string
//   genre: Genre
//   // publisher
// }
