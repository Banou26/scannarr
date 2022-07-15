import type Comment from './comment'
import type Handle from './handle'
import type Relation from './relation'
import type Category from './category'
import type Name from './name'
import type ImageData from './image-data'
import type Synopsis from './synopsis'
import type DateData from './date'
import type Tag from './tag'
import type Resolution from './resolution'
import type User from './user'
import { Team } from './team'
import { Series, SeriesHandle } from './series'

// todo: check if i can add any of https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes

export type TitleType = 'iframe' | 'torrent' | 'custom'
export type TitleRelation = 'previous' | 'next'

export type Title =
  {
    averageScore?: number
    categories: Category[]
    comments?: Comment[]
    dates?: DateData[]
    handles: TitleHandle[]
    images?: ImageData[]
    names?: Name[]
    /**
    * Title number (inside of the unit, if there's any)
    * Generally a tv show episode number or a manga's chapter number
    * Might be undefined for movies, ect...
    */
    number?: number
    recommendations?: Title[]
    relations?: Relation<Title>[]
    series?: Series
    synopses?: Synopsis[]
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    uri: string
    uris: string[]
  }

export type TitleHandle =
  Handle & {
    averageScore?: number
    /**
     * Only used for Titles that are parts of series
     */
    batch?: boolean
    categories?: Category[]
    comments?: Comment[]
    dates?: DateData[]
    description?: string
    handles?: TitleHandle[]
    images?: ImageData[]
    names?: Name[]
    /**
     * Title number (inside of the unit, if there's any)
     * Generally a tv show episode number or a manga's chapter number
     * will only be set if `batch: false`
    */
    number?: number
    /**
     * will only be set if `batch: true`
     */
    numbers?: number[]
    recommendations?: TitleHandle[]
    relations?: Relation<TitleHandle>[]
    resolution?: Resolution
    series?: SeriesHandle
    size?: number
    synopses?: Synopsis[]
    tags?: Tag[]
    team?: Team
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    uploadDate?: DateData
    uploader?: User
  }
