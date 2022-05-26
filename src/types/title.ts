import type { Handle } from './handle'
import type { Relation } from './relation'
import type { HandleTypeToType } from './utils'
import type Category from './category'
import type Name from './name'
import type ImageData from './image'
import type Synopsis from './synopsis'
import type DateData from './date'
import type Tag from './tag'

// todo: check if i can add any of https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes

export type TitleType = 'iframe' | 'torrent' | 'custom'
export type TitleRelation = 'previous' | 'next'

export type Title =
  HandleTypeToType<
    TitleHandle,
    'unit' | 'number' | 'names' | 'images' |
    'dates' | 'synopses' | 'tags' | 'number',
    {
      categories: (Handle & { category: Category })[]
      related: Relation<Title>[]
    }
  >

export type TitleHandle =
  Handle & {
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    /**
     * Title number (inside of the unit, if there's any)
     * Generally a tv show episode number or a manga's chapter number
    */
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
