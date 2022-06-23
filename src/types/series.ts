import type Handle from './handle'
import type Relation from './relation'
import type { Title, TitleHandle } from './title'
import type { GenreHandle } from './genre'
import type Category from './category'
import type DateData from './date'
import type ImageData from './image-data'
import type Name from './name'
import type Synopsis from './synopsis'
import type Tag from './tag'
import type MediaFormat from './media-format'

import { LanguageTag } from '../../../laserr/src/utils'

// todo: check if i can add any of https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes

export type SeriesRelation = 'SPIN_OFF' | 'ADAPTATION' | 'PREQUEL' | 'SEQUEL' | 'PARENT' | 'SIDE_STORY' | 'CHARACTER' | 'SUMMARY' | 'ALTERNATIVE' | 'OTHER' | 'SOURCE' | 'COMPILATION' | 'CONTAINS'
export type SeriesStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'
export type MediaSource = 'MANGA' | 'LIGHT_NOVEL' | 'VISUAL_NOVEL' | 'VIDEO_GAME' | 'OTHER' | 'NOVEL' | 'DOUJINSHI' | 'ANIME' | 'WEB_NOVEL' | 'LIVE_ACTION' | 'GAME' | 'COMIC' | 'MULTIMEDIA_PROJECT' | 'PICTURE_BOOK'

export type Series =
  {
    averageScore?: number
    categories: Category[]
    countryOfOrigin?: LanguageTag | string
    dates: DateData[]
    duration?: number
    format?: MediaFormat
    genres: GenreHandle[]
    handles: SeriesHandle[]
    images: ImageData[]
    isAdult?: boolean
    names: Name[]
    recommendations: SeriesHandle[]
    // todo: replace these SeriesHandle by Series
    relations: Relation<SeriesHandle>[]
    source?: MediaSource
    status?: SeriesStatus
    uri: string
    titleNumbers?: number
    titles: Title[]
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    uris: string[]
    synopses: Synopsis[]
  }

export type SeriesHandle =
  Handle & {
    averageScore?: number
    categories: Category[]
    countryOfOrigin?: LanguageTag | string
    dates?: DateData[]
    duration?: number
    format?: MediaFormat
    genres?: GenreHandle[]
    handles?: SeriesHandle[]
    images?: ImageData[]
    isAdult?: boolean
    names: Name[]
    recommendations?: SeriesHandle[]
    relations?: Relation<SeriesHandle>[]
    source?: MediaSource
    status?: SeriesStatus
    synopses?: Synopsis[]
    tags?: Tag[]
    titleNumbers?: number
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    titles?: TitleHandle[]
  }
