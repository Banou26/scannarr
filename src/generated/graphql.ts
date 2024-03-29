import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { ServerContext } from '../urql/client';
import { Uri } from '../utils/uri'
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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

export type Authenticate = {
  __typename?: 'Authenticate';
  oauth2?: Maybe<AuthenticateOauth2>;
};

export type AuthenticateInput = {
  oauth2?: InputMaybe<AuthenticateInputOauth2>;
  origin: Scalars['String'];
  type: AuthenticationMethodType;
};

export type AuthenticateInputOauth2 = {
  authorizationCode: Scalars['String'];
  clientId: Scalars['String'];
  codeVerifier: Scalars['String'];
  grantType: Scalars['String'];
  redirectUri: Scalars['String'];
};

export type AuthenticateOauth2 = {
  __typename?: 'AuthenticateOauth2';
  accessToken: Scalars['String'];
  expiresIn: Scalars['Int'];
  refreshToken: Scalars['String'];
  tokenType: Scalars['String'];
};

export type Authentication = {
  __typename?: 'Authentication';
  authentication?: Maybe<Scalars['Boolean']>;
  methods?: Maybe<Array<AuthenticationMethod>>;
  origin: Origin;
};

export type AuthenticationMethod = {
  __typename?: 'AuthenticationMethod';
  body?: Maybe<Scalars['String']>;
  headers?: Maybe<Array<AuthenticationMethodHeaderValue>>;
  type: AuthenticationMethodType;
  url?: Maybe<Scalars['String']>;
};

export type AuthenticationMethodHeaderValue = {
  __typename?: 'AuthenticationMethodHeaderValue';
  key: Scalars['String'];
  value: Scalars['String'];
};

export type AuthenticationMethodHeaderValueInput = {
  key: Scalars['String'];
  value: Scalars['String'];
};

export enum AuthenticationMethodType {
  Oauth2 = 'OAUTH2'
}

export type Episode = Handle & {
  __typename?: 'Episode';
  _id?: Maybe<Scalars['String']>;
  /** The time the episode airs at */
  airingAt?: Maybe<Scalars['Float']>;
  /** The description of the episode */
  description?: Maybe<Scalars['String']>;
  handles: Array<Episode>;
  id: Scalars['String'];
  /** The associate media of the episode */
  media?: Maybe<Media>;
  /** The associate media uri of the episode */
  mediaUri?: Maybe<Scalars['String']>;
  /** The episode number */
  number?: Maybe<Scalars['Float']>;
  origin: Scalars['String'];
  /** The playback information for the episode */
  playback: Array<PlaybackSource>;
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']>;
  /** Seconds until episode starts airing */
  timeUntilAiring?: Maybe<Scalars['Float']>;
  /** The title of the episode */
  title?: Maybe<MediaTitle>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type EpisodeInput = {
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['Uri']>;
};

export type EpisodePage = {
  __typename?: 'EpisodePage';
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
  /** The media page nodes */
  nodes: Array<Episode>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']>;
};

export type EpisodePageInput = {
  /** How many pages after the cursor to return */
  after?: InputMaybe<Scalars['Int']>;
  /** Cursor from where to start */
  at?: InputMaybe<Scalars['String']>;
  /** How many pages before the cursor to return */
  before?: InputMaybe<Scalars['Int']>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']>;
  /** Filter by search terms */
  search?: InputMaybe<Scalars['String']>;
  /** The order the results will be returned in */
  sorts?: InputMaybe<Array<EpisodeSort>>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['Uri']>;
};

export enum EpisodeSort {
  EndDate = 'END_DATE',
  EndDateDesc = 'END_DATE_DESC',
  Format = 'FORMAT',
  FormatDesc = 'FORMAT_DESC',
  Id = 'ID',
  IdDesc = 'ID_DESC',
  Latest = 'LATEST',
  Oldest = 'OLDEST',
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
  _id?: Maybe<Scalars['String']>;
  handles: Array<Handle>;
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

/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type Media = Handle & {
  __typename?: 'Media';
  _id?: Maybe<Scalars['String']>;
  /** The average score of the media */
  averageScore?: Maybe<Scalars['Float']>;
  /** The banner image of the media */
  bannerImage?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** The cover images of the media */
  coverImage?: Maybe<Array<Maybe<MediaCoverImage>>>;
  /** Long description of the media's story and characters */
  description?: Maybe<Scalars['String']>;
  /** The last official release date of the media */
  endDate?: Maybe<FuzzyDate>;
  episodeCount?: Maybe<Scalars['Int']>;
  episodes: Array<Episode>;
  /** External links to another site related to the media */
  externalLinks?: Maybe<Array<Maybe<MediaExternalLink>>>;
  format?: Maybe<MediaFormat>;
  handles: Array<Media>;
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
  _id?: Maybe<Scalars['String']>;
  /** The time the episode airs at */
  airingAt?: Maybe<Scalars['Float']>;
  /** The description of the episode */
  description?: Maybe<Scalars['String']>;
  /** The airing episode number */
  episodeNumber: Scalars['Int'];
  handles: Array<MediaAiringSchedule>;
  id: Scalars['String'];
  /** The associate media of the airing episode */
  media?: Maybe<Media>;
  /** The associate media uri of the airing episode */
  mediaUri?: Maybe<Scalars['String']>;
  origin: Scalars['String'];
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']>;
  /** Seconds until episode starts airing */
  timeUntilAiring?: Maybe<Scalars['Float']>;
  /** The title of the episode */
  title?: Maybe<MediaTitle>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
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

/** An external link to another site related to the media or its properties */
export type MediaExternalLink = Handle & {
  __typename?: 'MediaExternalLink';
  _id?: Maybe<Scalars['String']>;
  color?: Maybe<Scalars['String']>;
  handles: Array<MediaExternalLink>;
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

export type MediaInput = {
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['Uri']>;
};

export type MediaPage = {
  __typename?: 'MediaPage';
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
  /** The media page nodes */
  nodes: Array<Media>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']>;
};

export type MediaPageInput = {
  /** How many pages after the cursor to return */
  after?: InputMaybe<Scalars['Int']>;
  /** Cursor from where to start */
  at?: InputMaybe<Scalars['String']>;
  /** How many pages before the cursor to return */
  before?: InputMaybe<Scalars['Int']>;
  /** Filter by the end date of the media */
  endDate?: InputMaybe<Scalars['FuzzyDateInt']>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']>;
  /** Filter by search terms */
  search?: InputMaybe<Scalars['String']>;
  /** Filter by media season */
  season?: InputMaybe<MediaSeason>;
  /** Filter by the year of the media season */
  seasonYear?: InputMaybe<Scalars['Int']>;
  /** The order the results will be returned in */
  sorts?: InputMaybe<Array<MediaSort>>;
  /** Filter by the start date of the media */
  startDate?: InputMaybe<Scalars['FuzzyDateInt']>;
  /** Filter by the media's current release status */
  status?: InputMaybe<MediaStatus>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['Uri']>;
};

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
  _id?: Maybe<Scalars['String']>;
  handles: Array<MediaTrailer>;
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
  _empty?: Maybe<Scalars['String']>;
  authenticate: Authenticate;
  updateUserMedia: UserMedia;
};


export type MutationAuthenticateArgs = {
  input: AuthenticateInput;
};


export type MutationUpdateUserMediaArgs = {
  input: UpdateUserMediaInput;
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
  /** Origin ID, e.g: "nflx" for Netflix */
  origin: Scalars['String'];
  supportedUris?: Maybe<Array<Scalars['String']>>;
  /** The origin's URL, e.g "https://www.netflix.com/""  */
  url?: Maybe<Scalars['String']>;
};

export type OriginInput = {
  /** Filter by origin categories */
  categories?: InputMaybe<Array<MediaType>>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  /** Filter by if the origin only returns metadata */
  metadataOnly?: InputMaybe<Scalars['Boolean']>;
  /** Filter by the media origin */
  name?: InputMaybe<Scalars['String']>;
  /** Filter by if the origin is official */
  official?: InputMaybe<Scalars['Boolean']>;
};

export type OriginPageInput = {
  /** Filter by origin categories */
  categories?: InputMaybe<Array<MediaType>>;
  /** Filter by the media id */
  ids?: InputMaybe<Array<Scalars['String']>>;
  /** Filter by if the origin only returns metadata */
  metadataOnly?: InputMaybe<Scalars['Boolean']>;
  /** Filter by the media origin */
  names?: InputMaybe<Array<Scalars['String']>>;
  /** Filter by if the origin is official */
  official?: InputMaybe<Scalars['Boolean']>;
};

export type PlaybackSource = Handle & {
  __typename?: 'PlaybackSource';
  _id?: Maybe<Scalars['String']>;
  bytes?: Maybe<Scalars['Float']>;
  /** Stringified (json?) data for the playback, useful for custom players */
  data?: Maybe<Scalars['String']>;
  episode?: Maybe<Episode>;
  episodeRange?: Maybe<Scalars['String']>;
  filename?: Maybe<Scalars['String']>;
  filesCount?: Maybe<Scalars['Int']>;
  format?: Maybe<Scalars['String']>;
  handles: Array<PlaybackSource>;
  hash?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  media?: Maybe<Media>;
  origin: Scalars['String'];
  resolution?: Maybe<Scalars['String']>;
  structure?: Maybe<PlaybackSourceFileStructure>;
  team?: Maybe<Team>;
  thumbnails?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<MediaTitle>;
  /** The type of playback */
  type?: Maybe<PlaybackSourceType>;
  uploadDate?: Maybe<Scalars['Float']>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export enum PlaybackSourceFileStructure {
  Multi = 'MULTI',
  Single = 'SINGLE'
}

export type PlaybackSourceInput = {
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['Uri']>;
};

export type PlaybackSourcePage = {
  __typename?: 'PlaybackSourcePage';
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
  /** The media page nodes */
  nodes: Array<PlaybackSource>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']>;
};

export type PlaybackSourcePageInput = {
  /** How many pages after the cursor to return */
  after?: InputMaybe<Scalars['Int']>;
  /** Cursor from where to start */
  at?: InputMaybe<Scalars['String']>;
  /** How many pages before the cursor to return */
  before?: InputMaybe<Scalars['Int']>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']>;
  number?: InputMaybe<Scalars['Int']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']>;
  /** Filter by search terms */
  search?: InputMaybe<Scalars['String']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['Uri']>;
};

export enum PlaybackSourceType {
  Custom = 'CUSTOM',
  Iframe = 'IFRAME',
  Other = 'OTHER',
  Torrent = 'TORRENT'
}

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']>;
  authentications: Array<Authentication>;
  origin?: Maybe<Origin>;
  originPage: Array<Origin>;
  user: User;
};


export type QueryOriginArgs = {
  input: OriginInput;
};


export type QueryOriginPageArgs = {
  input: OriginPageInput;
};


export type QueryUserArgs = {
  input: UserInput;
};

export type Resource = Handle & {
  __typename?: 'Resource';
  _id?: Maybe<Scalars['String']>;
  batchResources: Array<Resource>;
  handles: Array<Resource>;
  id: Scalars['String'];
  isBatch?: Maybe<Scalars['Boolean']>;
  origin: Scalars['String'];
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']>;
  episode?: Maybe<Episode>;
  episodePage?: Maybe<EpisodePage>;
  media?: Maybe<Media>;
  mediaPage?: Maybe<MediaPage>;
  playbackSource?: Maybe<PlaybackSource>;
  playbackSourcePage?: Maybe<PlaybackSourcePage>;
  userMediaPage?: Maybe<UserMediaPage>;
};


export type SubscriptionEpisodeArgs = {
  input?: InputMaybe<EpisodeInput>;
};


export type SubscriptionEpisodePageArgs = {
  input?: InputMaybe<EpisodePageInput>;
};


export type SubscriptionMediaArgs = {
  input: MediaInput;
};


export type SubscriptionMediaPageArgs = {
  input: MediaPageInput;
};


export type SubscriptionPlaybackSourceArgs = {
  input?: InputMaybe<PlaybackSourceInput>;
};


export type SubscriptionPlaybackSourcePageArgs = {
  input?: InputMaybe<PlaybackSourcePageInput>;
};


export type SubscriptionUserMediaPageArgs = {
  input: UserMediaPageInput;
};

export type Team = Handle & {
  __typename?: 'Team';
  _id?: Maybe<Scalars['String']>;
  handles: Array<Team>;
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  origin: Scalars['String'];
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type UpdateUserMediaInput = {
  authentications: Array<UserMediaPageInputAuthentication>;
  isRewatching?: InputMaybe<Scalars['Boolean']>;
  mediaUri: Scalars['Uri'];
  origin: Scalars['String'];
  progress?: InputMaybe<Scalars['Int']>;
  rewatchCount?: InputMaybe<Scalars['Int']>;
  score?: InputMaybe<Scalars['Float']>;
  status?: InputMaybe<UserMediaStatus>;
};

export type User = {
  __typename?: 'User';
  avatar?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  username: Scalars['String'];
};

export type UserInput = {
  oauth2?: InputMaybe<UserInputOauth2>;
  origin: Scalars['String'];
  type: AuthenticationMethodType;
};

export type UserInputOauth2 = {
  accessToken: Scalars['String'];
  tokenType: Scalars['String'];
};

export type UserMedia = {
  __typename?: 'UserMedia';
  _id?: Maybe<Scalars['String']>;
  episodes: Array<UserMediaEpisode>;
  handles: Array<Media>;
  id: Scalars['String'];
  isRewatching?: Maybe<Scalars['Boolean']>;
  media: Media;
  origin: Scalars['String'];
  progress?: Maybe<Scalars['Int']>;
  rewatchCount?: Maybe<Scalars['Int']>;
  score?: Maybe<Scalars['Float']>;
  status: UserMediaStatus;
  updatedAt?: Maybe<Scalars['Float']>;
  uri: Scalars['Uri'];
  url?: Maybe<Scalars['String']>;
};

export type UserMediaEpisode = {
  __typename?: 'UserMediaEpisode';
  episode: Episode;
  origin: Origin;
  progress?: Maybe<Scalars['Float']>;
  uri: Scalars['Uri'];
  watched: Scalars['Boolean'];
};

export type UserMediaInput = {
  authentications: Array<UserMediaPageInputAuthentication>;
  uri: Scalars['Uri'];
};

export type UserMediaPage = {
  __typename?: 'UserMediaPage';
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
  /** The media page nodes */
  nodes: Array<UserMedia>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']>;
};

export type UserMediaPageInput = {
  authentications: Array<UserMediaPageInputAuthentication>;
  status?: InputMaybe<Array<UserMediaStatus>>;
};

export type UserMediaPageInputAuthentication = {
  oauth2?: InputMaybe<UserInputOauth2>;
  origin: Scalars['String'];
  type: AuthenticationMethodType;
};

/** The current releasing status of the media */
export enum UserMediaStatus {
  /** Has completed */
  Completed = 'COMPLETED',
  /** Dropped */
  Dropped = 'DROPPED',
  /** Put on hold */
  OnHold = 'ON_HOLD',
  /** Planning to watch */
  PlanToWatch = 'PLAN_TO_WATCH',
  /** Currently watching */
  Watching = 'WATCHING'
}



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
  Authenticate: ResolverTypeWrapper<Authenticate>;
  AuthenticateInput: AuthenticateInput;
  AuthenticateInputOauth2: AuthenticateInputOauth2;
  AuthenticateOauth2: ResolverTypeWrapper<AuthenticateOauth2>;
  Authentication: ResolverTypeWrapper<Authentication>;
  AuthenticationMethod: ResolverTypeWrapper<AuthenticationMethod>;
  AuthenticationMethodHeaderValue: ResolverTypeWrapper<AuthenticationMethodHeaderValue>;
  AuthenticationMethodHeaderValueInput: AuthenticationMethodHeaderValueInput;
  AuthenticationMethodType: AuthenticationMethodType;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CountryCode: ResolverTypeWrapper<Scalars['CountryCode']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  Episode: ResolverTypeWrapper<Episode>;
  EpisodeInput: EpisodeInput;
  EpisodePage: ResolverTypeWrapper<EpisodePage>;
  EpisodePageInput: EpisodePageInput;
  EpisodeSort: EpisodeSort;
  ExternalLinkMediaType: ExternalLinkMediaType;
  ExternalLinkType: ExternalLinkType;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  FuzzyDate: ResolverTypeWrapper<FuzzyDate>;
  FuzzyDateInput: FuzzyDateInput;
  FuzzyDateInt: ResolverTypeWrapper<Scalars['FuzzyDateInt']>;
  Handle: ResolversTypes['Episode'] | ResolversTypes['Media'] | ResolversTypes['MediaAiringSchedule'] | ResolversTypes['MediaExternalLink'] | ResolversTypes['MediaTrailer'] | ResolversTypes['PlaybackSource'] | ResolversTypes['Resource'] | ResolversTypes['Team'];
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Json: ResolverTypeWrapper<Scalars['Json']>;
  Media: ResolverTypeWrapper<Media>;
  MediaAiringSchedule: ResolverTypeWrapper<MediaAiringSchedule>;
  MediaCoverImage: ResolverTypeWrapper<MediaCoverImage>;
  MediaExternalLink: ResolverTypeWrapper<MediaExternalLink>;
  MediaFormat: MediaFormat;
  MediaInput: MediaInput;
  MediaPage: ResolverTypeWrapper<MediaPage>;
  MediaPageInput: MediaPageInput;
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
  OriginInput: OriginInput;
  OriginPageInput: OriginPageInput;
  PlaybackSource: ResolverTypeWrapper<PlaybackSource>;
  PlaybackSourceFileStructure: PlaybackSourceFileStructure;
  PlaybackSourceInput: PlaybackSourceInput;
  PlaybackSourcePage: ResolverTypeWrapper<PlaybackSourcePage>;
  PlaybackSourcePageInput: PlaybackSourcePageInput;
  PlaybackSourceType: PlaybackSourceType;
  Query: ResolverTypeWrapper<{}>;
  Resource: ResolverTypeWrapper<Resource>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  Team: ResolverTypeWrapper<Team>;
  UpdateUserMediaInput: UpdateUserMediaInput;
  Uri: ResolverTypeWrapper<Scalars['Uri']>;
  User: ResolverTypeWrapper<User>;
  UserInput: UserInput;
  UserInputOauth2: UserInputOauth2;
  UserMedia: ResolverTypeWrapper<UserMedia>;
  UserMediaEpisode: ResolverTypeWrapper<UserMediaEpisode>;
  UserMediaInput: UserMediaInput;
  UserMediaPage: ResolverTypeWrapper<UserMediaPage>;
  UserMediaPageInput: UserMediaPageInput;
  UserMediaPageInputAuthentication: UserMediaPageInputAuthentication;
  UserMediaStatus: UserMediaStatus;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Authenticate: Authenticate;
  AuthenticateInput: AuthenticateInput;
  AuthenticateInputOauth2: AuthenticateInputOauth2;
  AuthenticateOauth2: AuthenticateOauth2;
  Authentication: Authentication;
  AuthenticationMethod: AuthenticationMethod;
  AuthenticationMethodHeaderValue: AuthenticationMethodHeaderValue;
  AuthenticationMethodHeaderValueInput: AuthenticationMethodHeaderValueInput;
  Boolean: Scalars['Boolean'];
  CountryCode: Scalars['CountryCode'];
  Date: Scalars['Date'];
  Episode: Episode;
  EpisodeInput: EpisodeInput;
  EpisodePage: EpisodePage;
  EpisodePageInput: EpisodePageInput;
  Float: Scalars['Float'];
  FuzzyDate: FuzzyDate;
  FuzzyDateInput: FuzzyDateInput;
  FuzzyDateInt: Scalars['FuzzyDateInt'];
  Handle: ResolversParentTypes['Episode'] | ResolversParentTypes['Media'] | ResolversParentTypes['MediaAiringSchedule'] | ResolversParentTypes['MediaExternalLink'] | ResolversParentTypes['MediaTrailer'] | ResolversParentTypes['PlaybackSource'] | ResolversParentTypes['Resource'] | ResolversParentTypes['Team'];
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Json: Scalars['Json'];
  Media: Media;
  MediaAiringSchedule: MediaAiringSchedule;
  MediaCoverImage: MediaCoverImage;
  MediaExternalLink: MediaExternalLink;
  MediaInput: MediaInput;
  MediaPage: MediaPage;
  MediaPageInput: MediaPageInput;
  MediaSynonym: MediaSynonym;
  MediaTitle: MediaTitle;
  MediaTrailer: MediaTrailer;
  Mutation: {};
  Origin: Origin;
  OriginInput: OriginInput;
  OriginPageInput: OriginPageInput;
  PlaybackSource: PlaybackSource;
  PlaybackSourceInput: PlaybackSourceInput;
  PlaybackSourcePage: PlaybackSourcePage;
  PlaybackSourcePageInput: PlaybackSourcePageInput;
  Query: {};
  Resource: Resource;
  String: Scalars['String'];
  Subscription: {};
  Team: Team;
  UpdateUserMediaInput: UpdateUserMediaInput;
  Uri: Scalars['Uri'];
  User: User;
  UserInput: UserInput;
  UserInputOauth2: UserInputOauth2;
  UserMedia: UserMedia;
  UserMediaEpisode: UserMediaEpisode;
  UserMediaInput: UserMediaInput;
  UserMediaPage: UserMediaPage;
  UserMediaPageInput: UserMediaPageInput;
  UserMediaPageInputAuthentication: UserMediaPageInputAuthentication;
};

export type AuthenticateResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Authenticate'] = ResolversParentTypes['Authenticate']> = {
  oauth2?: Resolver<Maybe<ResolversTypes['AuthenticateOauth2']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthenticateOauth2Resolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['AuthenticateOauth2'] = ResolversParentTypes['AuthenticateOauth2']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expiresIn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthenticationResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Authentication'] = ResolversParentTypes['Authentication']> = {
  authentication?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  methods?: Resolver<Maybe<Array<ResolversTypes['AuthenticationMethod']>>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['Origin'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthenticationMethodResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['AuthenticationMethod'] = ResolversParentTypes['AuthenticationMethod']> = {
  body?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  headers?: Resolver<Maybe<Array<ResolversTypes['AuthenticationMethodHeaderValue']>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AuthenticationMethodType'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthenticationMethodHeaderValueResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['AuthenticationMethodHeaderValue'] = ResolversParentTypes['AuthenticationMethodHeaderValue']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['CountryCode'], any> {
  name: 'CountryCode';
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type EpisodeResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Episode'] = ResolversParentTypes['Episode']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  airingAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['Episode']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType>;
  mediaUri?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  number?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  playback?: Resolver<Array<ResolversTypes['PlaybackSource']>, ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeUntilAiring?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EpisodePageResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['EpisodePage'] = ResolversParentTypes['EpisodePage']> = {
  currentPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inPage?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lastPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Episode']>, ParentType, ContextType>;
  previousPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalBefore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FuzzyDateResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['FuzzyDate'] = ResolversParentTypes['FuzzyDate']> = {
  day?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  month?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  year?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface FuzzyDateIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['FuzzyDateInt'], any> {
  name: 'FuzzyDateInt';
}

export type HandleResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Handle'] = ResolversParentTypes['Handle']> = {
  __resolveType: TypeResolveFn<'Episode' | 'Media' | 'MediaAiringSchedule' | 'MediaExternalLink' | 'MediaTrailer' | 'PlaybackSource' | 'Resource' | 'Team', ParentType, ContextType>;
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['Handle']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
  name: 'Json';
}

export type MediaResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Media'] = ResolversParentTypes['Media']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  averageScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  bannerImage?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  coverImage?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaCoverImage']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaDescriptionArgs>>;
  endDate?: Resolver<Maybe<ResolversTypes['FuzzyDate']>, ParentType, ContextType>;
  episodeCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  episodes?: Resolver<Array<ResolversTypes['Episode']>, ParentType, ContextType, Partial<MediaEpisodesArgs>>;
  externalLinks?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaExternalLink']>>>, ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['MediaFormat']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['Media']>, ParentType, ContextType>;
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

export type MediaAiringScheduleResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaAiringSchedule'] = ResolversParentTypes['MediaAiringSchedule']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  airingAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episodeNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['MediaAiringSchedule']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType>;
  mediaUri?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeUntilAiring?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaCoverImageResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaCoverImage'] = ResolversParentTypes['MediaCoverImage']> = {
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  default?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extraLarge?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  large?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  medium?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  small?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaExternalLinkResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaExternalLink'] = ResolversParentTypes['MediaExternalLink']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['MediaExternalLink']>, ParentType, ContextType>;
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

export type MediaPageResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaPage'] = ResolversParentTypes['MediaPage']> = {
  currentPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inPage?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lastPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Media']>, ParentType, ContextType>;
  previousPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalBefore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaSynonymResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaSynonym'] = ResolversParentTypes['MediaSynonym']> = {
  isRomanized?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  score?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  synonym?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaTitleResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaTitle'] = ResolversParentTypes['MediaTitle']> = {
  english?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaTitleLanguageArgs>>;
  native?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  romanized?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userPreferred?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaTrailerResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['MediaTrailer'] = ResolversParentTypes['MediaTrailer']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['MediaTrailer']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authenticate?: Resolver<ResolversTypes['Authenticate'], ParentType, ContextType, RequireFields<MutationAuthenticateArgs, 'input'>>;
  updateUserMedia?: Resolver<ResolversTypes['UserMedia'], ParentType, ContextType, RequireFields<MutationUpdateUserMediaArgs, 'input'>>;
};

export type OriginResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Origin'] = ResolversParentTypes['Origin']> = {
  categories?: Resolver<Array<ResolversTypes['MediaType']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metadataOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  official?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  supportedUris?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlaybackSourceResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['PlaybackSource'] = ResolversParentTypes['PlaybackSource']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bytes?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episode?: Resolver<Maybe<ResolversTypes['Episode']>, ParentType, ContextType>;
  episodeRange?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  filename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  filesCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['PlaybackSource']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolution?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  structure?: Resolver<Maybe<ResolversTypes['PlaybackSourceFileStructure']>, ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType>;
  thumbnails?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['PlaybackSourceType']>, ParentType, ContextType>;
  uploadDate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlaybackSourcePageResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['PlaybackSourcePage'] = ResolversParentTypes['PlaybackSourcePage']> = {
  currentPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inPage?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lastPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['PlaybackSource']>, ParentType, ContextType>;
  previousPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalBefore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authentications?: Resolver<Array<ResolversTypes['Authentication']>, ParentType, ContextType>;
  origin?: Resolver<Maybe<ResolversTypes['Origin']>, ParentType, ContextType, RequireFields<QueryOriginArgs, 'input'>>;
  originPage?: Resolver<Array<ResolversTypes['Origin']>, ParentType, ContextType, RequireFields<QueryOriginPageArgs, 'input'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'input'>>;
};

export type ResourceResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Resource'] = ResolversParentTypes['Resource']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  batchResources?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isBatch?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _empty?: SubscriptionResolver<Maybe<ResolversTypes['String']>, "_empty", ParentType, ContextType>;
  episode?: SubscriptionResolver<Maybe<ResolversTypes['Episode']>, "episode", ParentType, ContextType, Partial<SubscriptionEpisodeArgs>>;
  episodePage?: SubscriptionResolver<Maybe<ResolversTypes['EpisodePage']>, "episodePage", ParentType, ContextType, Partial<SubscriptionEpisodePageArgs>>;
  media?: SubscriptionResolver<Maybe<ResolversTypes['Media']>, "media", ParentType, ContextType, RequireFields<SubscriptionMediaArgs, 'input'>>;
  mediaPage?: SubscriptionResolver<Maybe<ResolversTypes['MediaPage']>, "mediaPage", ParentType, ContextType, RequireFields<SubscriptionMediaPageArgs, 'input'>>;
  playbackSource?: SubscriptionResolver<Maybe<ResolversTypes['PlaybackSource']>, "playbackSource", ParentType, ContextType, Partial<SubscriptionPlaybackSourceArgs>>;
  playbackSourcePage?: SubscriptionResolver<Maybe<ResolversTypes['PlaybackSourcePage']>, "playbackSourcePage", ParentType, ContextType, Partial<SubscriptionPlaybackSourcePageArgs>>;
  userMediaPage?: SubscriptionResolver<Maybe<ResolversTypes['UserMediaPage']>, "userMediaPage", ParentType, ContextType, RequireFields<SubscriptionUserMediaPageArgs, 'input'>>;
};

export type TeamResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['Team']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UriScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Uri'], any> {
  name: 'Uri';
}

export type UserResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserMediaResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['UserMedia'] = ResolversParentTypes['UserMedia']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episodes?: Resolver<Array<ResolversTypes['UserMediaEpisode']>, ParentType, ContextType>;
  handles?: Resolver<Array<ResolversTypes['Media']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isRewatching?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  media?: Resolver<ResolversTypes['Media'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  progress?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rewatchCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  score?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserMediaStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserMediaEpisodeResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['UserMediaEpisode'] = ResolversParentTypes['UserMediaEpisode']> = {
  episode?: Resolver<ResolversTypes['Episode'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['Origin'], ParentType, ContextType>;
  progress?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  watched?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserMediaPageResolvers<ContextType = ServerContext, ParentType extends ResolversParentTypes['UserMediaPage'] = ResolversParentTypes['UserMediaPage']> = {
  currentPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inPage?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lastPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['UserMedia']>, ParentType, ContextType>;
  previousPageCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalBefore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = ServerContext> = {
  Authenticate?: AuthenticateResolvers<ContextType>;
  AuthenticateOauth2?: AuthenticateOauth2Resolvers<ContextType>;
  Authentication?: AuthenticationResolvers<ContextType>;
  AuthenticationMethod?: AuthenticationMethodResolvers<ContextType>;
  AuthenticationMethodHeaderValue?: AuthenticationMethodHeaderValueResolvers<ContextType>;
  CountryCode?: GraphQLScalarType;
  Date?: GraphQLScalarType;
  Episode?: EpisodeResolvers<ContextType>;
  EpisodePage?: EpisodePageResolvers<ContextType>;
  FuzzyDate?: FuzzyDateResolvers<ContextType>;
  FuzzyDateInt?: GraphQLScalarType;
  Handle?: HandleResolvers<ContextType>;
  Json?: GraphQLScalarType;
  Media?: MediaResolvers<ContextType>;
  MediaAiringSchedule?: MediaAiringScheduleResolvers<ContextType>;
  MediaCoverImage?: MediaCoverImageResolvers<ContextType>;
  MediaExternalLink?: MediaExternalLinkResolvers<ContextType>;
  MediaPage?: MediaPageResolvers<ContextType>;
  MediaSynonym?: MediaSynonymResolvers<ContextType>;
  MediaTitle?: MediaTitleResolvers<ContextType>;
  MediaTrailer?: MediaTrailerResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Origin?: OriginResolvers<ContextType>;
  PlaybackSource?: PlaybackSourceResolvers<ContextType>;
  PlaybackSourcePage?: PlaybackSourcePageResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Resource?: ResourceResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  Uri?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UserMedia?: UserMediaResolvers<ContextType>;
  UserMediaEpisode?: UserMediaEpisodeResolvers<ContextType>;
  UserMediaPage?: UserMediaPageResolvers<ContextType>;
};

