import type { Handle } from './handle'
import type { Relation } from './relation'
import type { Title, TitleHandle } from './title'
import type { HandleTypeToType } from './utils'
import type { GenreHandle } from './genre'
import type Category from './category'
import type DateData from './date'
import type ImageData from './image-data'
import type Name from './name'
import type Synopsis from './synopsis'
import type Tag from './tag'

// todo: check if i can add any of https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes

export type SeriesRelation = 'spinoff' | 'adaptation' | 'prequel' | 'sequel'

// export type Series =
//   HandleTypeToType<
//     SeriesHandle,
//     'names' | 'dates' | 'images' | 'synopses' |
//     'related' | 'recommended' | 'tags' | 'genres',
//     {
//       categories: (Handle & { category: Category })[]
//       related: Relation<Series>[]
//       titles: Title[]
//     }
//   >

export type Series =
  {
    uri: string
    uris: string[]
    categories: Category[]
    names: Name[]
    dates: DateData[]
    images: ImageData[]
    synopses: Synopsis[]
    // todo: replace these SeriesHandle by Series
    related: Relation<SeriesHandle>[]
    handles: SeriesHandle[]
    titles: TitleHandle[]
    recommended: SeriesHandle[]
    tags: Tag[]
    genres: GenreHandle[]
  }

export type SeriesHandle =
  Handle & {
    categories: Category[]
    names: Name[]
    dates: DateData[]
    images: ImageData[]
    synopses: Synopsis[]
    related: Relation<SeriesHandle>[]
    handles: SeriesHandle[]
    titles: TitleHandle[]
    recommended: SeriesHandle[]
    tags: Tag[]
    genres: GenreHandle[]
  }
