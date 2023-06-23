import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { Context } from '../server';
import { Uri } from '../utils/uri'
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** ISO 3166-1 alpha-2 country code */
  CountryCode: any;
  /** ISO 8601:2004 date-time */
  Date: any;
  /** 8 digit long date integer (YYYYMMDD). Unknown dates represented by 0. E.g. 2016: 20160000, May 1976: 19760500 */
  FuzzyDateInt: any;
  /** ISO 21778:2017 JavaScript Object Notation (JSON) */
  Json: any;
  /** RFC 3986 uniform resource identifier (URI) as stricter form "scheme:path */
  Uri: Uri;
};

export enum ExternalLinkMediaType {
  Anime = 'ANIME',
  Manga = 'MANGA',
  Staff = 'STAFF'
}

export enum ExternalLinkType {
  Info = 'INFO',
  Social = 'SOCIAL',
  Streaming = 'STREAMING'
}

/** Date object that allows for incomplete date values (fuzzy) */
export type FuzzyDate = {
  __typename?: 'FuzzyDate';
  /** Numeric Day (24) */
  day?: Maybe<Scalars['Int']>;
  /** Numeric Month (3) */
  month?: Maybe<Scalars['Int']>;
  /** Numeric Year (2017) */
  year?: Maybe<Scalars['Int']>;
};

/** Date object that allows for incomplete date values (fuzzy) */
export type FuzzyDateInput = {
  /** Numeric Day (24) */
  day?: InputMaybe<Scalars['Int']>;
  /** Numeric Month (3) */
  month?: InputMaybe<Scalars['Int']>;
  /** Numeric Year (2017) */
  year?: InputMaybe<Scalars['Int']>;
};

/**  A Handle represents a unique identifier for a resource.  */
export type Handle = {
  /**  The name of the handler, e.g: 'fkn' for packages handled by FKN  */
  handler: Scalars['String'];
  handles: HandleConnection;
  /**  The id of the resource, e.g: 'react' for the React package  */
  id: Scalars['String'];
  /**  The origin of the resource, e.g: 'npm', generally the host of the resource  */
  origin: Scalars['String'];
  /**
   * The uri of the resource.
   * An uri is the combination of the handler, the origin and the id
   * e.g: 'fkn:npm:react' for the React package
   */
  uri: Scalars['Uri'];
  /**  The URL of the resource, e.g: 'https://npmjs.com/package/react'  */
  url?: Maybe<Scalars['String']>;
};

export type HandleConnection = {
  edges: Array<HandleEdge>;
  nodes: Array<Handle>;
  /** The pagination information */
  pageInfo?: Maybe<PageInfo>;
};

export type HandleEdge = {
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Handle;
};

export enum HandleRelation {
  Identical = 'IDENTICAL'
}

/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type Media = Handle & {
  __typename?: 'Media';
  /** The average score of the media */
  averageScore?: Maybe<Scalars['Int']>;
  /** The banner image of the media */
  bannerImage?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** The cover images of the media */
  coverImage?: Maybe<Array<Maybe<MediaCoverImage>>>;
  /** Long description of the media's story and characters */
  description?: Maybe<Scalars['String']>;
  /** The last official release date of the media */
  endDate?: Maybe<FuzzyDate>;
  episodes?: Maybe<MediaEpisodeConnection>;
  /** External links to another site related to the media */
  externalLinks?: Maybe<Array<Maybe<MediaExternalLink>>>;
  format?: Maybe<MediaFormat>;
  handler: Scalars['String'];
  handles: MediaConnection;
  id: Scalars['String'];
  /** If the media is intended only for 18+ adult audiences */
  isAdult?: Maybe<Scalars['Boolean']>;
  origin: Scalars['String'];
  /** The number of users with the media on their list */
  popularity?: Maybe<Scalars['Int']>;
  /** The season the media was initially released in */
  season?: Maybe<MediaSeason>;
  /** The season year the media was initially released in */
  seasonYear?: Maybe<Scalars['Int']>;
  /** Short description of the media's story and characters */
  shortDescription?: Maybe<Scalars['String']>;
  /** The first official release date of the media */
  startDate?: Maybe<FuzzyDate>;
  /** The current releasing status of the media */
  status?: Maybe<MediaStatus>;
  /** Alternative titles of the media */
  synonyms?: Maybe<Array<Maybe<MediaSynonym>>>;
  /** The official titles of the media in various languages */
  title?: Maybe<MediaTitle>;
  /** Media trailer or advertisement */
  trailers?: Maybe<Array<Maybe<MediaTrailer>>>;
  /** The type of the media */
  type?: Maybe<MediaType>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};


/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type MediaDescriptionArgs = {
  asHtml?: InputMaybe<Scalars['Boolean']>;
};


/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type MediaEpisodesArgs = {
  notYetAired?: InputMaybe<Scalars['Boolean']>;
  page?: InputMaybe<Scalars['Int']>;
  perPage?: InputMaybe<Scalars['Int']>;
};


/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type MediaShortDescriptionArgs = {
  asHtml?: InputMaybe<Scalars['Boolean']>;
};

/** Media Airing Schedule. NOTE: We only aim to guarantee that FUTURE airing data is present and accurate. */
export type MediaAiringSchedule = Handle & {
  __typename?: 'MediaAiringSchedule';
  /** The time the episode airs at */
  airingAt: Scalars['Float'];
  /** The description of the episode */
  description?: Maybe<Scalars['String']>;
  /** The airing episode number */
  episodeNumber: Scalars['Int'];
  handler: Scalars['String'];
  handles: HandleConnection;
  id: Scalars['String'];
  /** The associate media of the airing episode */
  media?: Maybe<Media>;
  /** The associate media uri of the airing episode */
  mediaUri: Scalars['String'];
  origin: Scalars['String'];
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']>;
  /** Seconds until episode starts airing */
  timeUntilAiring: Scalars['Float'];
  /** The title of the episode */
  title?: Maybe<MediaTitle>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type MediaAiringScheduleConnection = {
  __typename?: 'MediaAiringScheduleConnection';
  edges?: Maybe<Array<Maybe<MediaAiringScheduleEdge>>>;
  nodes?: Maybe<Array<Maybe<MediaAiringSchedule>>>;
  /** The pagination information */
  pageInfo?: Maybe<PageInfo>;
};

/** MediaAiringSchedule connection edge */
export type MediaAiringScheduleEdge = {
  __typename?: 'MediaAiringScheduleEdge';
  node?: Maybe<MediaAiringSchedule>;
  /** The uri of the connection */
  uri?: Maybe<Scalars['Int']>;
};

export type MediaConnection = HandleConnection & {
  __typename?: 'MediaConnection';
  edges: Array<MediaEdge>;
  nodes: Array<Media>;
  /** The pagination information */
  pageInfo?: Maybe<PageInfo>;
};

/** The cover images of the media */
export type MediaCoverImage = {
  __typename?: 'MediaCoverImage';
  /** Average #hex color of cover image */
  color?: Maybe<Scalars['String']>;
  /** The cover image of the media by default. Using highest resolution available. */
  default?: Maybe<Scalars['String']>;
  /** The cover image of the media at its largest size. 500x735 */
  extraLarge?: Maybe<Scalars['String']>;
  /** The cover image of the media at large size. 250x367 */
  large?: Maybe<Scalars['String']>;
  /** The cover image of the media at medium size. 120x171 */
  medium?: Maybe<Scalars['String']>;
  /** The cover image of the media at small size. 64x92 */
  small?: Maybe<Scalars['String']>;
};

export type MediaEdge = HandleEdge & {
  __typename?: 'MediaEdge';
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Media;
};

export type MediaEpisode = {
  __typename?: 'MediaEpisode';
  /** The time the episode airs at */
  airingAt?: Maybe<Scalars['Float']>;
  /** The description of the episode */
  description?: Maybe<Scalars['String']>;
  handler: Scalars['String'];
  handles: MediaEpisodeConnection;
  id: Scalars['String'];
  /** The associate media of the episode */
  media?: Maybe<Media>;
  /** The associate media uri of the episode */
  mediaUri: Scalars['String'];
  /** The episode number */
  number: Scalars['Int'];
  origin: Scalars['String'];
  /** The playback information for the episode */
  playback?: Maybe<MediaEpisodePlayback>;
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']>;
  /** Seconds until episode starts airing */
  timeUntilAiring?: Maybe<Scalars['Float']>;
  /** The title of the episode */
  title?: Maybe<MediaTitle>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type MediaEpisodeConnection = {
  __typename?: 'MediaEpisodeConnection';
  edges?: Maybe<Array<Maybe<MediaEpisodeEdge>>>;
  nodes?: Maybe<Array<Maybe<MediaEpisode>>>;
  /** The pagination information */
  pageInfo?: Maybe<PageInfo>;
};

/** MediaEpisode connection edge */
export type MediaEpisodeEdge = {
  __typename?: 'MediaEpisodeEdge';
  node?: Maybe<MediaEpisode>;
  /** The uri of the connection */
  uri?: Maybe<Scalars['Int']>;
};

export type MediaEpisodePlayback = {
  __typename?: 'MediaEpisodePlayback';
  /** Stringified json data for the playback, useful for custom players */
  data?: Maybe<Scalars['String']>;
  /** The origin for the playback, can be used to determine libraries that can handle that playback */
  origin?: Maybe<Scalars['String']>;
  /** The type of playback */
  type?: Maybe<MediaEpisodePlaybackType>;
  /** The uri for the playback, could be a torrent magnet uri */
  uri?: Maybe<Scalars['String']>;
  /** The url for the playback, can be a html embed url */
  url?: Maybe<Scalars['String']>;
};

export enum MediaEpisodePlaybackType {
  Custom = 'CUSTOM',
  Iframe = 'IFRAME',
  Other = 'OTHER',
  Torrent = 'TORRENT'
}

/** An external link to another site related to the media or its properties */
export type MediaExternalLink = Handle & {
  __typename?: 'MediaExternalLink';
  color?: Maybe<Scalars['String']>;
  handler: Scalars['String'];
  handles: HandleConnection;
  /** The icon image url of the site. Not available for all links */
  icon?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  isDisabled?: Maybe<Scalars['Boolean']>;
  /** Language the site content is in */
  language?: Maybe<Scalars['String']>;
  notes?: Maybe<Scalars['String']>;
  origin: Scalars['String'];
  type?: Maybe<ExternalLinkType>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

/** The format the media was released in */
export enum MediaFormat {
  /** Professionally published manga with more than one chapter */
  Manga = 'MANGA',
  /** Anime movies with a theatrical release */
  Movie = 'MOVIE',
  /** Short anime released as a music video */
  Music = 'MUSIC',
  /** Written books released as a series of light novels */
  Novel = 'NOVEL',
  /** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
  Ona = 'ONA',
  /** Manga with just one chapter */
  OneShot = 'ONE_SHOT',
  /**
   * (Original Video Animation) Anime that have been released directly on
   * DVD/Blu-ray without originally going through a theatrical release or
   * television broadcast
   */
  Ova = 'OVA',
  /** Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc */
  Special = 'SPECIAL',
  /** Anime broadcast on television */
  Tv = 'TV',
  /** Anime which are under 15 minutes in length and broadcast on television */
  TvShort = 'TV_SHORT'
}

export enum MediaSeason {
  /** Months September to November */
  Fall = 'FALL',
  /** Months March to May */
  Spring = 'SPRING',
  /** Months June to August */
  Summer = 'SUMMER',
  /** Months December to February */
  Winter = 'WINTER'
}

export enum MediaSort {
  EndDate = 'END_DATE',
  EndDateDesc = 'END_DATE_DESC',
  Format = 'FORMAT',
  FormatDesc = 'FORMAT_DESC',
  Id = 'ID',
  IdDesc = 'ID_DESC',
  Popularity = 'POPULARITY',
  PopularityDesc = 'POPULARITY_DESC',
  Score = 'SCORE',
  ScoreDesc = 'SCORE_DESC',
  SearchMatch = 'SEARCH_MATCH',
  StartDate = 'START_DATE',
  StartDateDesc = 'START_DATE_DESC',
  Status = 'STATUS',
  StatusDesc = 'STATUS_DESC',
  TitleEnglish = 'TITLE_ENGLISH',
  TitleEnglishDesc = 'TITLE_ENGLISH_DESC',
  TitleNative = 'TITLE_NATIVE',
  TitleNativeDesc = 'TITLE_NATIVE_DESC',
  TitleRomanized = 'TITLE_ROMANIZED',
  TitleRomanizedDesc = 'TITLE_ROMANIZED_DESC',
  Type = 'TYPE',
  TypeDesc = 'TYPE_DESC'
}

/** Source type the media was adapted from */
export enum MediaSource {
  /** Japanese Anime */
  Anime = 'ANIME',
  /** Comics excluding manga */
  Comic = 'COMIC',
  /** Self-published works */
  Doujinshi = 'DOUJINSHI',
  /** Games excluding video games */
  Game = 'GAME',
  /** Written work published in volumes */
  LightNovel = 'LIGHT_NOVEL',
  /** Live action media such as movies or TV show */
  LiveAction = 'LIVE_ACTION',
  /** Asian comic book */
  Manga = 'MANGA',
  /** Multimedia project */
  MultimediaProject = 'MULTIMEDIA_PROJECT',
  /** Written works not published in volumes */
  Novel = 'NOVEL',
  /** An original production not based of another work */
  Original = 'ORIGINAL',
  /** Other */
  Other = 'OTHER',
  /** Picture book */
  PictureBook = 'PICTURE_BOOK',
  /** Video game */
  VideoGame = 'VIDEO_GAME',
  /** Video game driven primary by text and narrative */
  VisualNovel = 'VISUAL_NOVEL',
  /** Written works published online */
  WebNovel = 'WEB_NOVEL'
}

/** The current releasing status of the media */
export enum MediaStatus {
  /** Ended before the work could be finished */
  Cancelled = 'CANCELLED',
  /** Has completed and is no longer being released */
  Finished = 'FINISHED',
  /** Is currently paused from releasing and will resume at a later date */
  Hiatus = 'HIATUS',
  /** To be released at a later date */
  NotYetReleased = 'NOT_YET_RELEASED',
  /** Currently releasing */
  Releasing = 'RELEASING'
}

/** Alternative titles of the media */
export type MediaSynonym = {
  __typename?: 'MediaSynonym';
  /** Is alternative title a romanized version of the native title */
  isRomanized?: Maybe<Scalars['Boolean']>;
  /** The language the title is in */
  language?: Maybe<Scalars['String']>;
  /** The score of the title based on searchability */
  score?: Maybe<Scalars['Float']>;
  /** The alternative title */
  synonym?: Maybe<Scalars['String']>;
};

/** The official titles of the media in various languages */
export type MediaTitle = {
  __typename?: 'MediaTitle';
  /** The official english title */
  english?: Maybe<Scalars['String']>;
  /** The official language title */
  language?: Maybe<Scalars['String']>;
  /** Official title in it's native language */
  native?: Maybe<Scalars['String']>;
  /** Official title in it's romanized form */
  romanized?: Maybe<Scalars['String']>;
  /** The currently authenticated users preferred title language. Default english */
  userPreferred?: Maybe<Scalars['String']>;
};


/** The official titles of the media in various languages */
export type MediaTitleLanguageArgs = {
  countryCode?: InputMaybe<Scalars['CountryCode']>;
};

/** Media trailer or advertisement */
export type MediaTrailer = Handle & {
  __typename?: 'MediaTrailer';
  handler: Scalars['String'];
  handles: HandleConnection;
  id: Scalars['String'];
  origin: Scalars['String'];
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

/** The type of the media */
export enum MediaType {
  /** Japanese Anime */
  Anime = 'ANIME',
  /** Comics excluding manga */
  Comic = 'COMIC',
  /** Self-published works */
  Doujinshi = 'DOUJINSHI',
  /** Games excluding video games */
  Game = 'GAME',
  /** Written work published in volumes */
  LightNovel = 'LIGHT_NOVEL',
  /** Live action media such as movies or TV show */
  LiveAction = 'LIVE_ACTION',
  /** Asian comic book */
  Manga = 'MANGA',
  /** Movies with a theatrical release */
  Movie = 'MOVIE',
  /** Multimedia project */
  MultimediaProject = 'MULTIMEDIA_PROJECT',
  /** Short anime released as a music video */
  Music = 'MUSIC',
  /** Written works not published in volumes */
  Novel = 'NOVEL',
  /** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
  Ona = 'ONA',
  /** Manga with just one chapter */
  OneShot = 'ONE_SHOT',
  /** Other */
  Other = 'OTHER',
  /**
   * (Original Video Animation) Anime that have been released directly on
   * DVD/Blu-ray without originally going through a theatrical release or
   * television broadcast
   */
  Ova = 'OVA',
  /** Picture book */
  PictureBook = 'PICTURE_BOOK',
  /** Software */
  Software = 'SOFTWARE',
  /** Special episodes that have been included in DVD/Blu-ray releases, pilots, etc */
  Special = 'SPECIAL',
  /** Media broadcast on television */
  Tv = 'TV',
  /** Media which are under 15 minutes in length and broadcast on television */
  TvShort = 'TV_SHORT',
  /** Video */
  Video = 'VIDEO',
  /** Video game */
  VideoGame = 'VIDEO_GAME',
  /** Video game driven primary by text and narrative */
  VisualNovel = 'VISUAL_NOVEL',
  /** Written works published online */
  WebNovel = 'WEB_NOVEL'
}

export type Mutation = {
  __typename?: 'Mutation';
  dummy?: Maybe<Scalars['String']>;
};

/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type Origin = {
  __typename?: 'Origin';
  /** The media types of the target */
  categories: Array<MediaType>;
  /** The icon URL */
  icon?: Maybe<Scalars['String']>;
  /** Origin ID, e.g: "nflx" for Netflix */
  id: Scalars['String'];
  /** If the origin returns metadata only, e.g no playback or download data */
  metadataOnly?: Maybe<Scalars['Boolean']>;
  /** Origin full name, e.g: "Netflix"  */
  name: Scalars['String'];
  /** If the origin is official, e.g a legal redistributor or platform */
  official?: Maybe<Scalars['Boolean']>;
  /** The origin's URL, e.g "https://www.netflix.com/""  */
  url?: Maybe<Scalars['String']>;
};

export type Page = {
  __typename?: 'Page';
  media: Array<Media>;
  origin: Array<Origin>;
  pageInfo: PageInfo;
};


export type PageMediaArgs = {
  endDate?: InputMaybe<Scalars['FuzzyDateInt']>;
  endDate_greater?: InputMaybe<Scalars['FuzzyDateInt']>;
  endDate_lesser?: InputMaybe<Scalars['FuzzyDateInt']>;
  endDate_like?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  origin?: InputMaybe<Scalars['String']>;
  search?: InputMaybe<Scalars['String']>;
  season?: InputMaybe<MediaSeason>;
  seasonYear?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<Array<InputMaybe<MediaSort>>>;
  startDate?: InputMaybe<Scalars['FuzzyDateInt']>;
  startDate_greater?: InputMaybe<Scalars['FuzzyDateInt']>;
  startDate_lesser?: InputMaybe<Scalars['FuzzyDateInt']>;
  startDate_like?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<MediaStatus>;
  status_in?: InputMaybe<Array<InputMaybe<MediaStatus>>>;
  status_not?: InputMaybe<MediaStatus>;
  status_not_in?: InputMaybe<Array<InputMaybe<MediaStatus>>>;
  uri?: InputMaybe<Scalars['String']>;
};


export type PageOriginArgs = {
  categories?: InputMaybe<Array<MediaType>>;
  ids?: InputMaybe<Array<Scalars['String']>>;
  metadataOnly?: InputMaybe<Scalars['Boolean']>;
  names?: InputMaybe<Array<Scalars['String']>>;
  official?: InputMaybe<Scalars['Boolean']>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  /** The current page */
  currentPageCursor?: Maybe<Scalars['String']>;
  /** The first page */
  firstPageCursor?: Maybe<Scalars['String']>;
  /** Total number of items on the current page */
  inPage?: Maybe<Scalars['Int']>;
  /** The last page cursor */
  lastPageCursor?: Maybe<Scalars['String']>;
  /** The current page */
  nextPageCursor?: Maybe<Scalars['String']>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']>;
};

export type Query = {
  __typename?: 'Query';
  Episode?: Maybe<MediaEpisode>;
  Media?: Maybe<Media>;
  Origin?: Maybe<Origin>;
  Page: Page;
  dummy?: Maybe<Scalars['String']>;
};


export type QueryEpisodeArgs = {
  id?: InputMaybe<Scalars['String']>;
  origin?: InputMaybe<Scalars['String']>;
  search?: InputMaybe<Scalars['String']>;
  uri?: InputMaybe<Scalars['String']>;
};


export type QueryMediaArgs = {
  endDate?: InputMaybe<Scalars['FuzzyDateInt']>;
  endDate_greater?: InputMaybe<Scalars['FuzzyDateInt']>;
  endDate_lesser?: InputMaybe<Scalars['FuzzyDateInt']>;
  endDate_like?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  origin?: InputMaybe<Scalars['String']>;
  search?: InputMaybe<Scalars['String']>;
  season?: InputMaybe<MediaSeason>;
  seasonYear?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<Array<InputMaybe<MediaSort>>>;
  startDate?: InputMaybe<Scalars['FuzzyDateInt']>;
  startDate_greater?: InputMaybe<Scalars['FuzzyDateInt']>;
  startDate_lesser?: InputMaybe<Scalars['FuzzyDateInt']>;
  startDate_like?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<MediaStatus>;
  status_in?: InputMaybe<Array<InputMaybe<MediaStatus>>>;
  status_not?: InputMaybe<MediaStatus>;
  status_not_in?: InputMaybe<Array<InputMaybe<MediaStatus>>>;
  uri?: InputMaybe<Scalars['String']>;
};


export type QueryOriginArgs = {
  categories?: InputMaybe<Array<MediaType>>;
  id?: InputMaybe<Scalars['String']>;
  metadataOnly?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  official?: InputMaybe<Scalars['Boolean']>;
};


export type QueryPageArgs = {
  after?: InputMaybe<Scalars['Int']>;
  at?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['Int']>;
};

export type Resource = Handle & {
  __typename?: 'Resource';
  batchResources: Array<ResourceConnection>;
  handler: Scalars['String'];
  handles: ResourceConnection;
  id: Scalars['String'];
  isBatch?: Maybe<Scalars['Boolean']>;
  origin: Scalars['String'];
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type ResourceConnection = HandleConnection & {
  __typename?: 'ResourceConnection';
  edges: Array<ResourceEdge>;
  nodes: Array<Resource>;
  /** The pagination information */
  pageInfo?: Maybe<PageInfo>;
};

export type ResourceEdge = HandleEdge & {
  __typename?: 'ResourceEdge';
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Resource;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CountryCode: ResolverTypeWrapper<Scalars['CountryCode']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  ExternalLinkMediaType: ExternalLinkMediaType;
  ExternalLinkType: ExternalLinkType;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  FuzzyDate: ResolverTypeWrapper<FuzzyDate>;
  FuzzyDateInput: FuzzyDateInput;
  FuzzyDateInt: ResolverTypeWrapper<Scalars['FuzzyDateInt']>;
  Handle: ResolversTypes['Media'] | ResolversTypes['MediaAiringSchedule'] | ResolversTypes['MediaExternalLink'] | ResolversTypes['MediaTrailer'] | ResolversTypes['Resource'];
  HandleConnection: ResolversTypes['MediaConnection'] | ResolversTypes['ResourceConnection'];
  HandleEdge: ResolversTypes['MediaEdge'] | ResolversTypes['ResourceEdge'];
  HandleRelation: HandleRelation;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Json: ResolverTypeWrapper<Scalars['Json']>;
  Media: ResolverTypeWrapper<Media>;
  MediaAiringSchedule: ResolverTypeWrapper<MediaAiringSchedule>;
  MediaAiringScheduleConnection: ResolverTypeWrapper<MediaAiringScheduleConnection>;
  MediaAiringScheduleEdge: ResolverTypeWrapper<MediaAiringScheduleEdge>;
  MediaConnection: ResolverTypeWrapper<MediaConnection>;
  MediaCoverImage: ResolverTypeWrapper<MediaCoverImage>;
  MediaEdge: ResolverTypeWrapper<MediaEdge>;
  MediaEpisode: ResolverTypeWrapper<MediaEpisode>;
  MediaEpisodeConnection: ResolverTypeWrapper<MediaEpisodeConnection>;
  MediaEpisodeEdge: ResolverTypeWrapper<MediaEpisodeEdge>;
  MediaEpisodePlayback: ResolverTypeWrapper<MediaEpisodePlayback>;
  MediaEpisodePlaybackType: MediaEpisodePlaybackType;
  MediaExternalLink: ResolverTypeWrapper<MediaExternalLink>;
  MediaFormat: MediaFormat;
  MediaSeason: MediaSeason;
  MediaSort: MediaSort;
  MediaSource: MediaSource;
  MediaStatus: MediaStatus;
  MediaSynonym: ResolverTypeWrapper<MediaSynonym>;
  MediaTitle: ResolverTypeWrapper<MediaTitle>;
  MediaTrailer: ResolverTypeWrapper<MediaTrailer>;
  MediaType: MediaType;
  Mutation: ResolverTypeWrapper<{}>;
  Origin: ResolverTypeWrapper<Origin>;
  Page: ResolverTypeWrapper<Page>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Query: ResolverTypeWrapper<{}>;
  Resource: ResolverTypeWrapper<Resource>;
  ResourceConnection: ResolverTypeWrapper<ResourceConnection>;
  ResourceEdge: ResolverTypeWrapper<ResourceEdge>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Uri: ResolverTypeWrapper<Scalars['Uri']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean'];
  CountryCode: Scalars['CountryCode'];
  Date: Scalars['Date'];
  Float: Scalars['Float'];
  FuzzyDate: FuzzyDate;
  FuzzyDateInput: FuzzyDateInput;
  FuzzyDateInt: Scalars['FuzzyDateInt'];
  Handle: ResolversParentTypes['Media'] | ResolversParentTypes['MediaAiringSchedule'] | ResolversParentTypes['MediaExternalLink'] | ResolversParentTypes['MediaTrailer'] | ResolversParentTypes['Resource'];
  HandleConnection: ResolversParentTypes['MediaConnection'] | ResolversParentTypes['ResourceConnection'];
  HandleEdge: ResolversParentTypes['MediaEdge'] | ResolversParentTypes['ResourceEdge'];
  Int: Scalars['Int'];
  Json: Scalars['Json'];
  Media: Media;
  MediaAiringSchedule: MediaAiringSchedule;
  MediaAiringScheduleConnection: MediaAiringScheduleConnection;
  MediaAiringScheduleEdge: MediaAiringScheduleEdge;
  MediaConnection: MediaConnection;
  MediaCoverImage: MediaCoverImage;
  MediaEdge: MediaEdge;
  MediaEpisode: MediaEpisode;
  MediaEpisodeConnection: MediaEpisodeConnection;
  MediaEpisodeEdge: MediaEpisodeEdge;
  MediaEpisodePlayback: MediaEpisodePlayback;
  MediaExternalLink: MediaExternalLink;
  MediaSynonym: MediaSynonym;
  MediaTitle: MediaTitle;
  MediaTrailer: MediaTrailer;
  Mutation: {};
  Origin: Origin;
  Page: Page;
  PageInfo: PageInfo;
  Query: {};
  Resource: Resource;
  ResourceConnection: ResourceConnection;
  ResourceEdge: ResourceEdge;
  String: Scalars['String'];
  Uri: Scalars['Uri'];
};

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['CountryCode'], any> {
  name: 'CountryCode';
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type FuzzyDateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FuzzyDate'] = ResolversParentTypes['FuzzyDate']> = {
  day?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  month?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  year?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface FuzzyDateIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['FuzzyDateInt'], any> {
  name: 'FuzzyDateInt';
}

export type HandleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Handle'] = ResolversParentTypes['Handle']> = {
  __resolveType: TypeResolveFn<'Media' | 'MediaAiringSchedule' | 'MediaExternalLink' | 'MediaTrailer' | 'Resource', ParentType, ContextType>;
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type HandleConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HandleConnection'] = ResolversParentTypes['HandleConnection']> = {
  __resolveType: TypeResolveFn<'MediaConnection' | 'ResourceConnection', ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes['HandleEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Handle']>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
};

export type HandleEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HandleEdge'] = ResolversParentTypes['HandleEdge']> = {
  __resolveType: TypeResolveFn<'MediaEdge' | 'ResourceEdge', ParentType, ContextType>;
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Handle'], ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
  name: 'Json';
}

export type MediaResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Media'] = ResolversParentTypes['Media']> = {
  averageScore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  bannerImage?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  coverImage?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaCoverImage']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaDescriptionArgs>>;
  endDate?: Resolver<Maybe<ResolversTypes['FuzzyDate']>, ParentType, ContextType>;
  episodes?: Resolver<Maybe<ResolversTypes['MediaEpisodeConnection']>, ParentType, ContextType, Partial<MediaEpisodesArgs>>;
  externalLinks?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaExternalLink']>>>, ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['MediaFormat']>, ParentType, ContextType>;
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['MediaConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isAdult?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  popularity?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  season?: Resolver<Maybe<ResolversTypes['MediaSeason']>, ParentType, ContextType>;
  seasonYear?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  shortDescription?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaShortDescriptionArgs>>;
  startDate?: Resolver<Maybe<ResolversTypes['FuzzyDate']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['MediaStatus']>, ParentType, ContextType>;
  synonyms?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaSynonym']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  trailers?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaTrailer']>>>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['MediaType']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaAiringScheduleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaAiringSchedule'] = ResolversParentTypes['MediaAiringSchedule']> = {
  airingAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episodeNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType>;
  mediaUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeUntilAiring?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaAiringScheduleConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaAiringScheduleConnection'] = ResolversParentTypes['MediaAiringScheduleConnection']> = {
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaAiringScheduleEdge']>>>, ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaAiringSchedule']>>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaAiringScheduleEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaAiringScheduleEdge'] = ResolversParentTypes['MediaAiringScheduleEdge']> = {
  node?: Resolver<Maybe<ResolversTypes['MediaAiringSchedule']>, ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaConnection'] = ResolversParentTypes['MediaConnection']> = {
  edges?: Resolver<Array<ResolversTypes['MediaEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Media']>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaCoverImageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaCoverImage'] = ResolversParentTypes['MediaCoverImage']> = {
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  default?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extraLarge?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  large?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  medium?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  small?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaEdge'] = ResolversParentTypes['MediaEdge']> = {
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Media'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaEpisodeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaEpisode'] = ResolversParentTypes['MediaEpisode']> = {
  airingAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['MediaEpisodeConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType>;
  mediaUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  playback?: Resolver<Maybe<ResolversTypes['MediaEpisodePlayback']>, ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeUntilAiring?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaEpisodeConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaEpisodeConnection'] = ResolversParentTypes['MediaEpisodeConnection']> = {
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaEpisodeEdge']>>>, ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaEpisode']>>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaEpisodeEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaEpisodeEdge'] = ResolversParentTypes['MediaEpisodeEdge']> = {
  node?: Resolver<Maybe<ResolversTypes['MediaEpisode']>, ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaEpisodePlaybackResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaEpisodePlayback'] = ResolversParentTypes['MediaEpisodePlayback']> = {
  data?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  origin?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['MediaEpisodePlaybackType']>, ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaExternalLinkResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaExternalLink'] = ResolversParentTypes['MediaExternalLink']> = {
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDisabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['ExternalLinkType']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaSynonymResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaSynonym'] = ResolversParentTypes['MediaSynonym']> = {
  isRomanized?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  score?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  synonym?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaTitleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaTitle'] = ResolversParentTypes['MediaTitle']> = {
  english?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaTitleLanguageArgs>>;
  native?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  romanized?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userPreferred?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaTrailerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaTrailer'] = ResolversParentTypes['MediaTrailer']> = {
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  dummy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type OriginResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Origin'] = ResolversParentTypes['Origin']> = {
  categories?: Resolver<Array<ResolversTypes['MediaType']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metadataOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  official?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Page'] = ResolversParentTypes['Page']> = {
  media?: Resolver<Array<ResolversTypes['Media']>, ParentType, ContextType, Partial<PageMediaArgs>>;
  origin?: Resolver<Array<ResolversTypes['Origin']>, ParentType, ContextType, Partial<PageOriginArgs>>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  currentPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inPage?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lastPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  previousPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalBefore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  Episode?: Resolver<Maybe<ResolversTypes['MediaEpisode']>, ParentType, ContextType, Partial<QueryEpisodeArgs>>;
  Media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType, Partial<QueryMediaArgs>>;
  Origin?: Resolver<Maybe<ResolversTypes['Origin']>, ParentType, ContextType, Partial<QueryOriginArgs>>;
  Page?: Resolver<ResolversTypes['Page'], ParentType, ContextType, Partial<QueryPageArgs>>;
  dummy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ResourceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Resource'] = ResolversParentTypes['Resource']> = {
  batchResources?: Resolver<Array<ResolversTypes['ResourceConnection']>, ParentType, ContextType>;
  handler?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['ResourceConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isBatch?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResourceConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ResourceConnection'] = ResolversParentTypes['ResourceConnection']> = {
  edges?: Resolver<Array<ResolversTypes['ResourceEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResourceEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ResourceEdge'] = ResolversParentTypes['ResourceEdge']> = {
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Resource'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UriScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Uri'], any> {
  name: 'Uri';
}

export type Resolvers<ContextType = Context> = {
  CountryCode?: GraphQLScalarType;
  Date?: GraphQLScalarType;
  FuzzyDate?: FuzzyDateResolvers<ContextType>;
  FuzzyDateInt?: GraphQLScalarType;
  Handle?: HandleResolvers<ContextType>;
  HandleConnection?: HandleConnectionResolvers<ContextType>;
  HandleEdge?: HandleEdgeResolvers<ContextType>;
  Json?: GraphQLScalarType;
  Media?: MediaResolvers<ContextType>;
  MediaAiringSchedule?: MediaAiringScheduleResolvers<ContextType>;
  MediaAiringScheduleConnection?: MediaAiringScheduleConnectionResolvers<ContextType>;
  MediaAiringScheduleEdge?: MediaAiringScheduleEdgeResolvers<ContextType>;
  MediaConnection?: MediaConnectionResolvers<ContextType>;
  MediaCoverImage?: MediaCoverImageResolvers<ContextType>;
  MediaEdge?: MediaEdgeResolvers<ContextType>;
  MediaEpisode?: MediaEpisodeResolvers<ContextType>;
  MediaEpisodeConnection?: MediaEpisodeConnectionResolvers<ContextType>;
  MediaEpisodeEdge?: MediaEpisodeEdgeResolvers<ContextType>;
  MediaEpisodePlayback?: MediaEpisodePlaybackResolvers<ContextType>;
  MediaExternalLink?: MediaExternalLinkResolvers<ContextType>;
  MediaSynonym?: MediaSynonymResolvers<ContextType>;
  MediaTitle?: MediaTitleResolvers<ContextType>;
  MediaTrailer?: MediaTrailerResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Origin?: OriginResolvers<ContextType>;
  Page?: PageResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Resource?: ResourceResolvers<ContextType>;
  ResourceConnection?: ResourceConnectionResolvers<ContextType>;
  ResourceEdge?: ResourceEdgeResolvers<ContextType>;
  Uri?: GraphQLScalarType;
};

