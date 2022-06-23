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
import { LanguageTag } from '../../../laserr/src/utils'

// todo: check if i can add any of https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes

export type SeriesRelation = 'SPIN_OFF' | 'ADAPTATION' | 'PREQUEL' | 'SEQUEL' | 'PARENT' | 'SIDE_STORY' | 'CHARACTER' | 'SUMMARY' | 'ALTERNATIVE' | 'OTHER' | 'SOURCE' | 'COMPILATION' | 'CONTAINS'
export type SeriesStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'
export type SeriesFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT'
export type MediaSource = 'MANGA' | 'LIGHT_NOVEL' | 'VISUAL_NOVEL' | 'VIDEO_GAME' | 'OTHER' | 'NOVEL' | 'DOUJINSHI' | 'ANIME' | 'WEB_NOVEL' | 'LIVE_ACTION' | 'GAME' | 'COMIC' | 'MULTIMEDIA_PROJECT' | 'PICTURE_BOOK'

export type Series =
  {
    uri: string
    uris: string[]
    categories: Category[]
    names: Name[]
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    format?: SeriesFormat
    status?: SeriesStatus
    dates: DateData[]
    duration?: number
    source?: MediaSource
    images: ImageData[]
    countryOfOrigin?: LanguageTag | string
    averageScore?: number
    isAdult?: boolean
    synopses: Synopsis[]
    // todo: replace these SeriesHandle by Series
    relations: Relation<SeriesHandle>[]
    handles: SeriesHandle[]
    titles: TitleHandle[]
    titleNumbers?: number
    recommendations: SeriesHandle[]
    genres: GenreHandle[]
  }

export type SeriesHandle =
  Handle & {
    categories: Category[]
    names: Name[]
    /**
     * Usually refers to a tv show's season number or a book's number in a book series, if there's any
     * If anyone has a better general name, we could change it to something that makes more sense
    */
    unit?: number
    format?: SeriesFormat
    status?: SeriesStatus
    dates?: DateData[]
    duration?: number
    source?: MediaSource
    images?: ImageData[]
    countryOfOrigin?: LanguageTag | string
    averageScore?: number
    isAdult?: boolean
    synopses?: Synopsis[]
    relations?: Relation<SeriesHandle>[]
    handles?: SeriesHandle[]
    titles?: TitleHandle[]
    titleNumbers?: number
    recommendations?: SeriesHandle[]
    tags?: Tag[]
    genres?: GenreHandle[]
  }
