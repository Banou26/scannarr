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

// todo: check if i can add any of https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes

export type TitleType = 'iframe' | 'torrent' | 'custom'
export type TitleRelation = 'previous' | 'next'

export type Title =
  {
    categories: Category[]
    dates: DateData[]
     handles: TitleHandle[]
     images: ImageData[]
     names: Name[]
     /**
      * Title number (inside of the unit, if there's any)
      * Generally a tv show episode number or a manga's chapter number
     */
     number: number
     recommended: TitleHandle[]
     // todo: replace these TitleHandle by Title
     related: Relation<TitleHandle>[]
     synopses: Synopsis[]
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
    batch?: boolean
    categories?: Category[]
    comments?: Comment[]
    dates?: DateData[]
    uploadDate?: DateData
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
    recommended?: TitleHandle[]
    related?: Relation<TitleHandle>[]
    resolution?: Resolution
    size?: number
    synopses?: Synopsis[]
    description?: string
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    uploader?: User
    tags?: Tag[]
    team?: Team
  }
