import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string | number; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** ISO 3166-1 alpha-2 country code */
  CountryCode: { input: any; output: any; }
  /** ISO 8601:2004 date-time */
  Date: { input: any; output: any; }
  /** 8 digit long date integer (YYYYMMDD). Unknown dates represented by 0. E.g. 2016: 20160000, May 1976: 19760500 */
  FuzzyDateInt: { input: any; output: any; }
  /** ISO 21778:2017 JavaScript Object Notation (JSON) */
  Json: { input: any; output: any; }
  /** RFC 3986 uniform resource identifier (URI) as stricter form "scheme:path */
  Uri: { input: any; output: any; }
};

export type Episode = Handle & {
  __typename?: 'Episode';
  /** The time the episode airs at */
  airingAt?: Maybe<Scalars['Float']['output']>;
  /** The description of the episode */
  description?: Maybe<Scalars['String']['output']>;
  handles: EpisodeConnection;
  id: Scalars['String']['output'];
  /** The associate media of the episode */
  media?: Maybe<Media>;
  /** The associate media uri of the episode */
  mediaUri?: Maybe<Scalars['String']['output']>;
  /** The episode number */
  number?: Maybe<Scalars['Float']['output']>;
  origin: Scalars['String']['output'];
  /** The playback information for the episode */
  playback?: Maybe<PlaybackSourceConnection>;
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']['output']>;
  /** Seconds until episode starts airing */
  timeUntilAiring?: Maybe<Scalars['Float']['output']>;
  /** The title of the episode */
  title?: Maybe<MediaTitle>;
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type EpisodeConnection = HandleConnection & {
  __typename?: 'EpisodeConnection';
  edges: Array<EpisodeEdge>;
  nodes: Array<Episode>;
};

/** Episode connection edge */
export type EpisodeEdge = HandleEdge & {
  __typename?: 'EpisodeEdge';
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Episode;
  /** The uri of the connection */
  uri?: Maybe<Scalars['Int']['output']>;
};

export type EpisodeInput = {
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type EpisodePage = {
  __typename?: 'EpisodePage';
  /** The current page */
  currentPageCursor?: Maybe<Scalars['String']['output']>;
  /** The first page */
  firstPageCursor?: Maybe<Scalars['String']['output']>;
  /** Total number of items on the current page */
  inPage?: Maybe<Scalars['Int']['output']>;
  /** The last page cursor */
  lastPageCursor?: Maybe<Scalars['String']['output']>;
  /** The current page */
  nextPageCursor?: Maybe<Scalars['String']['output']>;
  /** The media page nodes */
  nodes: Array<Episode>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']['output']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']['output']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']['output']>;
};

export type EpisodePageInput = {
  /** How many pages after the cursor to return */
  after?: InputMaybe<Scalars['Int']['input']>;
  /** Cursor from where to start */
  at?: InputMaybe<Scalars['String']['input']>;
  /** How many pages before the cursor to return */
  before?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']['input']>;
  /** Filter by search terms */
  search?: InputMaybe<Scalars['String']['input']>;
  /** The order the results will be returned in */
  sorts?: InputMaybe<Array<EpisodeSort>>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type EpisodeSort =
  | 'END_DATE'
  | 'END_DATE_DESC'
  | 'FORMAT'
  | 'FORMAT_DESC'
  | 'ID'
  | 'ID_DESC'
  | 'LATEST'
  | 'OLDEST'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'SEARCH_MATCH'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'STATUS'
  | 'STATUS_DESC'
  | 'TITLE_ENGLISH'
  | 'TITLE_ENGLISH_DESC'
  | 'TITLE_NATIVE'
  | 'TITLE_NATIVE_DESC'
  | 'TITLE_ROMANIZED'
  | 'TITLE_ROMANIZED_DESC'
  | 'TYPE'
  | 'TYPE_DESC';

export type ExternalLinkMediaType =
  | 'ANIME'
  | 'MANGA'
  | 'STAFF';

export type ExternalLinkType =
  | 'INFO'
  | 'SOCIAL'
  | 'STREAMING';

/** Date object that allows for incomplete date values (fuzzy) */
export type FuzzyDate = {
  __typename?: 'FuzzyDate';
  /** Numeric Day (24) */
  day?: Maybe<Scalars['Int']['output']>;
  /** Numeric Month (3) */
  month?: Maybe<Scalars['Int']['output']>;
  /** Numeric Year (2017) */
  year?: Maybe<Scalars['Int']['output']>;
};

/** Date object that allows for incomplete date values (fuzzy) */
export type FuzzyDateInput = {
  /** Numeric Day (24) */
  day?: InputMaybe<Scalars['Int']['input']>;
  /** Numeric Month (3) */
  month?: InputMaybe<Scalars['Int']['input']>;
  /** Numeric Year (2017) */
  year?: InputMaybe<Scalars['Int']['input']>;
};

/**  A Handle represents a unique identifier for a resource.  */
export type Handle = {
  handles: HandleConnection;
  /**  The id of the resource, e.g: 'react' for the React package  */
  id: Scalars['String']['output'];
  /**  The origin of the resource, e.g: 'npm', generally the host of the resource  */
  origin: Scalars['String']['output'];
  /**
   * The uri of the resource.
   * An uri is the combination of the handler, the origin and the id
   * e.g: 'fkn:npm:react' for the React package
   */
  uri: Scalars['Uri']['output'];
  /**  The URL of the resource, e.g: 'https://npmjs.com/package/react'  */
  url?: Maybe<Scalars['String']['output']>;
};

export type HandleConnection = {
  edges: Array<HandleEdge>;
  nodes: Array<Handle>;
};

export type HandleEdge = {
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Handle;
};

export type HandleRelation =
  | 'IDENTICAL';

/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type Media = Handle & {
  __typename?: 'Media';
  /** The average score of the media */
  averageScore?: Maybe<Scalars['Float']['output']>;
  /** The banner image of the media */
  bannerImage?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The cover images of the media */
  coverImage?: Maybe<Array<Maybe<MediaCoverImage>>>;
  /** Long description of the media's story and characters */
  description?: Maybe<Scalars['String']['output']>;
  /** The last official release date of the media */
  endDate?: Maybe<FuzzyDate>;
  episodeCount?: Maybe<Scalars['Int']['output']>;
  episodes?: Maybe<EpisodeConnection>;
  /** External links to another site related to the media */
  externalLinks?: Maybe<Array<Maybe<MediaExternalLink>>>;
  format?: Maybe<MediaFormat>;
  handles: MediaConnection;
  id: Scalars['String']['output'];
  /** If the media is intended only for 18+ adult audiences */
  isAdult?: Maybe<Scalars['Boolean']['output']>;
  origin: Scalars['String']['output'];
  /** The number of users with the media on their list */
  popularity?: Maybe<Scalars['Int']['output']>;
  /** The season the media was initially released in */
  season?: Maybe<MediaSeason>;
  /** The season year the media was initially released in */
  seasonYear?: Maybe<Scalars['Int']['output']>;
  /** Short description of the media's story and characters */
  shortDescription?: Maybe<Scalars['String']['output']>;
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
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};


/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type MediaDescriptionArgs = {
  asHtml?: InputMaybe<Scalars['Boolean']['input']>;
};


/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type MediaEpisodesArgs = {
  notYetAired?: InputMaybe<Scalars['Boolean']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * Media is a type of handle that represents a media.
 * It generally represents a Movie, TV Show, Game, Package, ect...
 */
export type MediaShortDescriptionArgs = {
  asHtml?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Media Airing Schedule. NOTE: We only aim to guarantee that FUTURE airing data is present and accurate. */
export type MediaAiringSchedule = Handle & {
  __typename?: 'MediaAiringSchedule';
  /** The time the episode airs at */
  airingAt?: Maybe<Scalars['Float']['output']>;
  /** The description of the episode */
  description?: Maybe<Scalars['String']['output']>;
  /** The airing episode number */
  episodeNumber: Scalars['Int']['output'];
  handles: HandleConnection;
  id: Scalars['String']['output'];
  /** The associate media of the airing episode */
  media?: Maybe<Media>;
  /** The associate media uri of the airing episode */
  mediaUri?: Maybe<Scalars['String']['output']>;
  origin: Scalars['String']['output'];
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']['output']>;
  /** Seconds until episode starts airing */
  timeUntilAiring?: Maybe<Scalars['Float']['output']>;
  /** The title of the episode */
  title?: Maybe<MediaTitle>;
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type MediaAiringScheduleConnection = {
  __typename?: 'MediaAiringScheduleConnection';
  edges?: Maybe<Array<Maybe<MediaAiringScheduleEdge>>>;
  nodes?: Maybe<Array<Maybe<MediaAiringSchedule>>>;
};

/** MediaAiringSchedule connection edge */
export type MediaAiringScheduleEdge = {
  __typename?: 'MediaAiringScheduleEdge';
  node?: Maybe<MediaAiringSchedule>;
  /** The uri of the connection */
  uri?: Maybe<Scalars['Int']['output']>;
};

export type MediaConnection = HandleConnection & {
  __typename?: 'MediaConnection';
  edges: Array<MediaEdge>;
  nodes: Array<Media>;
};

/** The cover images of the media */
export type MediaCoverImage = {
  __typename?: 'MediaCoverImage';
  /** Average #hex color of cover image */
  color?: Maybe<Scalars['String']['output']>;
  /** The cover image of the media by default. Using highest resolution available. */
  default?: Maybe<Scalars['String']['output']>;
  /** The cover image of the media at its largest size. 500x735 */
  extraLarge?: Maybe<Scalars['String']['output']>;
  /** The cover image of the media at large size. 250x367 */
  large?: Maybe<Scalars['String']['output']>;
  /** The cover image of the media at medium size. 120x171 */
  medium?: Maybe<Scalars['String']['output']>;
  /** The cover image of the media at small size. 64x92 */
  small?: Maybe<Scalars['String']['output']>;
};

export type MediaEdge = HandleEdge & {
  __typename?: 'MediaEdge';
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Media;
};

/** An external link to another site related to the media or its properties */
export type MediaExternalLink = Handle & {
  __typename?: 'MediaExternalLink';
  color?: Maybe<Scalars['String']['output']>;
  handles: HandleConnection;
  /** The icon image url of the site. Not available for all links */
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isDisabled?: Maybe<Scalars['Boolean']['output']>;
  /** Language the site content is in */
  language?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  origin: Scalars['String']['output'];
  type?: Maybe<ExternalLinkType>;
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

/** The format the media was released in */
export type MediaFormat =
  /** Professionally published manga with more than one chapter */
  | 'MANGA'
  /** Anime movies with a theatrical release */
  | 'MOVIE'
  /** Short anime released as a music video */
  | 'MUSIC'
  /** Written books released as a series of light novels */
  | 'NOVEL'
  /** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
  | 'ONA'
  /** Manga with just one chapter */
  | 'ONE_SHOT'
  /**
   * (Original Video Animation) Anime that have been released directly on
   * DVD/Blu-ray without originally going through a theatrical release or
   * television broadcast
   */
  | 'OVA'
  /** Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc */
  | 'SPECIAL'
  /** Anime broadcast on television */
  | 'TV'
  /** Anime which are under 15 minutes in length and broadcast on television */
  | 'TV_SHORT';

export type MediaInput = {
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type MediaPage = {
  __typename?: 'MediaPage';
  /** The current page */
  currentPageCursor?: Maybe<Scalars['String']['output']>;
  /** The first page */
  firstPageCursor?: Maybe<Scalars['String']['output']>;
  /** Total number of items on the current page */
  inPage?: Maybe<Scalars['Int']['output']>;
  /** The last page cursor */
  lastPageCursor?: Maybe<Scalars['String']['output']>;
  /** The current page */
  nextPageCursor?: Maybe<Scalars['String']['output']>;
  /** The media page nodes */
  nodes: Array<Media>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']['output']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']['output']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']['output']>;
};

export type MediaPageInput = {
  /** How many pages after the cursor to return */
  after?: InputMaybe<Scalars['Int']['input']>;
  /** Cursor from where to start */
  at?: InputMaybe<Scalars['String']['input']>;
  /** How many pages before the cursor to return */
  before?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by the end date of the media */
  endDate?: InputMaybe<Scalars['FuzzyDateInt']['input']>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']['input']>;
  /** Filter by search terms */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by media season */
  season?: InputMaybe<MediaSeason>;
  /** Filter by the year of the media season */
  seasonYear?: InputMaybe<Scalars['Int']['input']>;
  /** The order the results will be returned in */
  sorts?: InputMaybe<Array<MediaSort>>;
  /** Filter by the start date of the media */
  startDate?: InputMaybe<Scalars['FuzzyDateInt']['input']>;
  /** Filter by the media's current release status */
  status?: InputMaybe<MediaStatus>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type MediaSeason =
  /** Months September to November */
  | 'FALL'
  /** Months March to May */
  | 'SPRING'
  /** Months June to August */
  | 'SUMMER'
  /** Months December to February */
  | 'WINTER';

export type MediaSort =
  | 'END_DATE'
  | 'END_DATE_DESC'
  | 'FORMAT'
  | 'FORMAT_DESC'
  | 'ID'
  | 'ID_DESC'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'SEARCH_MATCH'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'STATUS'
  | 'STATUS_DESC'
  | 'TITLE_ENGLISH'
  | 'TITLE_ENGLISH_DESC'
  | 'TITLE_NATIVE'
  | 'TITLE_NATIVE_DESC'
  | 'TITLE_ROMANIZED'
  | 'TITLE_ROMANIZED_DESC'
  | 'TYPE'
  | 'TYPE_DESC';

/** Source type the media was adapted from */
export type MediaSource =
  /** Japanese Anime */
  | 'ANIME'
  /** Comics excluding manga */
  | 'COMIC'
  /** Self-published works */
  | 'DOUJINSHI'
  /** Games excluding video games */
  | 'GAME'
  /** Written work published in volumes */
  | 'LIGHT_NOVEL'
  /** Live action media such as movies or TV show */
  | 'LIVE_ACTION'
  /** Asian comic book */
  | 'MANGA'
  /** Multimedia project */
  | 'MULTIMEDIA_PROJECT'
  /** Written works not published in volumes */
  | 'NOVEL'
  /** An original production not based of another work */
  | 'ORIGINAL'
  /** Other */
  | 'OTHER'
  /** Picture book */
  | 'PICTURE_BOOK'
  /** Video game */
  | 'VIDEO_GAME'
  /** Video game driven primary by text and narrative */
  | 'VISUAL_NOVEL'
  /** Written works published online */
  | 'WEB_NOVEL';

/** The current releasing status of the media */
export type MediaStatus =
  /** Ended before the work could be finished */
  | 'CANCELLED'
  /** Has completed and is no longer being released */
  | 'FINISHED'
  /** Is currently paused from releasing and will resume at a later date */
  | 'HIATUS'
  /** To be released at a later date */
  | 'NOT_YET_RELEASED'
  /** Currently releasing */
  | 'RELEASING';

/** Alternative titles of the media */
export type MediaSynonym = {
  __typename?: 'MediaSynonym';
  /** Is alternative title a romanized version of the native title */
  isRomanized?: Maybe<Scalars['Boolean']['output']>;
  /** The language the title is in */
  language?: Maybe<Scalars['String']['output']>;
  /** The score of the title based on searchability */
  score?: Maybe<Scalars['Float']['output']>;
  /** The alternative title */
  synonym?: Maybe<Scalars['String']['output']>;
};

/** The official titles of the media in various languages */
export type MediaTitle = {
  __typename?: 'MediaTitle';
  /** The official english title */
  english?: Maybe<Scalars['String']['output']>;
  /** The official language title */
  language?: Maybe<Scalars['String']['output']>;
  /** Official title in it's native language */
  native?: Maybe<Scalars['String']['output']>;
  /** Official title in it's romanized form */
  romanized?: Maybe<Scalars['String']['output']>;
  /** The currently authenticated users preferred title language. Default english */
  userPreferred?: Maybe<Scalars['String']['output']>;
};


/** The official titles of the media in various languages */
export type MediaTitleLanguageArgs = {
  countryCode?: InputMaybe<Scalars['CountryCode']['input']>;
};

/** Media trailer or advertisement */
export type MediaTrailer = Handle & {
  __typename?: 'MediaTrailer';
  handles: HandleConnection;
  id: Scalars['String']['output'];
  origin: Scalars['String']['output'];
  /** The url for the thumbnail image of the video */
  thumbnail?: Maybe<Scalars['String']['output']>;
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

/** The type of the media */
export type MediaType =
  /** Japanese Anime */
  | 'ANIME'
  /** Comics excluding manga */
  | 'COMIC'
  /** Self-published works */
  | 'DOUJINSHI'
  /** Games excluding video games */
  | 'GAME'
  /** Written work published in volumes */
  | 'LIGHT_NOVEL'
  /** Live action media such as movies or TV show */
  | 'LIVE_ACTION'
  /** Asian comic book */
  | 'MANGA'
  /** Movies with a theatrical release */
  | 'MOVIE'
  /** Multimedia project */
  | 'MULTIMEDIA_PROJECT'
  /** Short anime released as a music video */
  | 'MUSIC'
  /** Written works not published in volumes */
  | 'NOVEL'
  /** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
  | 'ONA'
  /** Manga with just one chapter */
  | 'ONE_SHOT'
  /** Other */
  | 'OTHER'
  /**
   * (Original Video Animation) Anime that have been released directly on
   * DVD/Blu-ray without originally going through a theatrical release or
   * television broadcast
   */
  | 'OVA'
  /** Picture book */
  | 'PICTURE_BOOK'
  /** Software */
  | 'SOFTWARE'
  /** Special episodes that have been included in DVD/Blu-ray releases, pilots, etc */
  | 'SPECIAL'
  /** Media broadcast on television */
  | 'TV'
  /** Media which are under 15 minutes in length and broadcast on television */
  | 'TV_SHORT'
  /** Video */
  | 'VIDEO'
  /** Video game */
  | 'VIDEO_GAME'
  /** Video game driven primary by text and narrative */
  | 'VISUAL_NOVEL'
  /** Written works published online */
  | 'WEB_NOVEL';

export type Mutation = {
  __typename?: 'Mutation';
  dummy?: Maybe<Scalars['String']['output']>;
  originAuthenticate: OriginAuthenticate;
};


export type MutationOriginAuthenticateArgs = {
  input: OriginAuthenticateInput;
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
  icon?: Maybe<Scalars['String']['output']>;
  /** Origin ID, e.g: "nflx" for Netflix */
  id: Scalars['String']['output'];
  /** If the origin returns metadata only, e.g no playback or download data */
  metadataOnly?: Maybe<Scalars['Boolean']['output']>;
  /** Origin full name, e.g: "Netflix"  */
  name: Scalars['String']['output'];
  /** If the origin is official, e.g a legal redistributor or platform */
  official?: Maybe<Scalars['Boolean']['output']>;
  /** Origin ID, e.g: "nflx" for Netflix */
  origin: Scalars['String']['output'];
  supportedUris?: Maybe<Array<Scalars['String']['output']>>;
  /** The origin's URL, e.g "https://www.netflix.com/""  */
  url?: Maybe<Scalars['String']['output']>;
};

export type OriginAuthenticate = {
  __typename?: 'OriginAuthenticate';
  oauth2?: Maybe<OriginAuthenticateOauth2>;
};

export type OriginAuthenticateInput = {
  oauth2?: InputMaybe<OriginAuthenticateInputOauth2>;
  origin: Scalars['String']['input'];
  type: OriginAuthenticationMethodType;
};

export type OriginAuthenticateInputOauth2 = {
  authorizationCode: Scalars['String']['input'];
  clientId: Scalars['String']['input'];
  codeVerifier: Scalars['String']['input'];
  grantType: Scalars['String']['input'];
  redirectUri: Scalars['String']['input'];
};

export type OriginAuthenticateOauth2 = {
  __typename?: 'OriginAuthenticateOauth2';
  accessToken: Scalars['String']['output'];
  expiresIn: Scalars['Int']['output'];
  refreshToken: Scalars['String']['output'];
  tokenType: Scalars['String']['output'];
};

export type OriginAuthentication = {
  __typename?: 'OriginAuthentication';
  authentication?: Maybe<Scalars['Boolean']['output']>;
  methods?: Maybe<Array<OriginAuthenticationMethod>>;
  origin: Origin;
};

export type OriginAuthenticationMethod = {
  __typename?: 'OriginAuthenticationMethod';
  body?: Maybe<Scalars['String']['output']>;
  headers?: Maybe<Array<OriginAuthenticationMethodHeaderValue>>;
  type: OriginAuthenticationMethodType;
  url?: Maybe<Scalars['String']['output']>;
};

export type OriginAuthenticationMethodHeaderValue = {
  __typename?: 'OriginAuthenticationMethodHeaderValue';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type OriginAuthenticationMethodHeaderValueInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type OriginAuthenticationMethodType =
  | 'OAUTH2';

export type OriginInput = {
  /** Filter by origin categories */
  categories?: InputMaybe<Array<MediaType>>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Filter by if the origin only returns metadata */
  metadataOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by the media origin */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Filter by if the origin is official */
  official?: InputMaybe<Scalars['Boolean']['input']>;
};

export type OriginPageInput = {
  /** Filter by origin categories */
  categories?: InputMaybe<Array<MediaType>>;
  /** Filter by the media id */
  ids?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter by if the origin only returns metadata */
  metadataOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by the media origin */
  names?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter by if the origin is official */
  official?: InputMaybe<Scalars['Boolean']['input']>;
};

export type OriginUser = {
  __typename?: 'OriginUser';
  avatar?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type OriginUserInput = {
  oauth2?: InputMaybe<OriginUserInputOauth2>;
  origin: Scalars['String']['input'];
  type: OriginAuthenticationMethodType;
};

export type OriginUserInputOauth2 = {
  accessToken: Scalars['String']['input'];
  tokenType: Scalars['String']['input'];
};

export type PlaybackSource = Handle & {
  __typename?: 'PlaybackSource';
  bytes?: Maybe<Scalars['Float']['output']>;
  /** Stringified (json?) data for the playback, useful for custom players */
  data?: Maybe<Scalars['String']['output']>;
  episode?: Maybe<Episode>;
  episodeRange?: Maybe<Scalars['String']['output']>;
  filename?: Maybe<Scalars['String']['output']>;
  filesCount?: Maybe<Scalars['Int']['output']>;
  format?: Maybe<Scalars['String']['output']>;
  handles: PlaybackSourceConnection;
  hash?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  media?: Maybe<Media>;
  origin: Scalars['String']['output'];
  resolution?: Maybe<Scalars['String']['output']>;
  structure?: Maybe<PlaybackSourceFileStructure>;
  team?: Maybe<Team>;
  thumbnails?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  title?: Maybe<MediaTitle>;
  /** The type of playback */
  type?: Maybe<PlaybackSourceType>;
  uploadDate?: Maybe<Scalars['Float']['output']>;
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type PlaybackSourceConnection = HandleConnection & {
  __typename?: 'PlaybackSourceConnection';
  edges: Array<PlaybackSourceEdge>;
  nodes: Array<PlaybackSource>;
};

/** PlaybackSource connection edge */
export type PlaybackSourceEdge = HandleEdge & {
  __typename?: 'PlaybackSourceEdge';
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: PlaybackSource;
  /** The uri of the connection */
  uri?: Maybe<Scalars['Int']['output']>;
};

export type PlaybackSourceFileStructure =
  | 'MULTI'
  | 'SINGLE';

export type PlaybackSourceInput = {
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type PlaybackSourcePage = {
  __typename?: 'PlaybackSourcePage';
  /** The current page */
  currentPageCursor?: Maybe<Scalars['String']['output']>;
  /** The first page */
  firstPageCursor?: Maybe<Scalars['String']['output']>;
  /** Total number of items on the current page */
  inPage?: Maybe<Scalars['Int']['output']>;
  /** The last page cursor */
  lastPageCursor?: Maybe<Scalars['String']['output']>;
  /** The current page */
  nextPageCursor?: Maybe<Scalars['String']['output']>;
  /** The media page nodes */
  nodes: Array<PlaybackSource>;
  /** The current page */
  previousPageCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  total?: Maybe<Scalars['Int']['output']>;
  /** Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalAfter?: Maybe<Scalars['Int']['output']>;
  /** Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic */
  totalBefore?: Maybe<Scalars['Int']['output']>;
};

export type PlaybackSourcePageInput = {
  /** How many pages after the cursor to return */
  after?: InputMaybe<Scalars['Int']['input']>;
  /** Cursor from where to start */
  at?: InputMaybe<Scalars['String']['input']>;
  /** How many pages before the cursor to return */
  before?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by the media id */
  id?: InputMaybe<Scalars['String']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by the media origin */
  origin?: InputMaybe<Scalars['String']['input']>;
  /** Filter by search terms */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the media uri */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type PlaybackSourceType =
  | 'CUSTOM'
  | 'IFRAME'
  | 'OTHER'
  | 'TORRENT';

export type Query = {
  __typename?: 'Query';
  dummy?: Maybe<Scalars['String']['output']>;
  episode?: Maybe<Episode>;
  episodePage?: Maybe<EpisodePage>;
  media?: Maybe<Media>;
  mediaPage?: Maybe<MediaPage>;
  origin?: Maybe<Origin>;
  originAuthentication: Array<OriginAuthentication>;
  originPage: Array<Origin>;
  originUser: OriginUser;
  playbackSource?: Maybe<PlaybackSource>;
  playbackSourcePage?: Maybe<PlaybackSourcePage>;
};


export type QueryEpisodeArgs = {
  input?: InputMaybe<EpisodeInput>;
};


export type QueryEpisodePageArgs = {
  input?: InputMaybe<EpisodePageInput>;
};


export type QueryMediaArgs = {
  input?: InputMaybe<MediaInput>;
};


export type QueryMediaPageArgs = {
  input: MediaPageInput;
};


export type QueryOriginArgs = {
  input: OriginInput;
};


export type QueryOriginPageArgs = {
  input: OriginPageInput;
};


export type QueryOriginUserArgs = {
  input: OriginUserInput;
};


export type QueryPlaybackSourceArgs = {
  input?: InputMaybe<PlaybackSourceInput>;
};


export type QueryPlaybackSourcePageArgs = {
  input?: InputMaybe<PlaybackSourcePageInput>;
};

export type Resource = Handle & {
  __typename?: 'Resource';
  batchResources: Array<ResourceConnection>;
  handles: ResourceConnection;
  id: Scalars['String']['output'];
  isBatch?: Maybe<Scalars['Boolean']['output']>;
  origin: Scalars['String']['output'];
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type ResourceConnection = HandleConnection & {
  __typename?: 'ResourceConnection';
  edges: Array<ResourceEdge>;
  nodes: Array<Resource>;
};

export type ResourceEdge = HandleEdge & {
  __typename?: 'ResourceEdge';
  /** The relation between the two handles */
  handleRelationType: HandleRelation;
  node: Resource;
};

export type Team = Handle & {
  __typename?: 'Team';
  handles: HandleConnection;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  origin: Scalars['String']['output'];
  uri: Scalars['Uri']['output'];
  url?: Maybe<Scalars['String']['output']>;
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


/** Mapping of interface types */
export type ResolversInterfaceTypes<RefType extends Record<string, unknown>> = {
  Handle: ( Episode & { __typename: 'Episode' } ) | ( Media & { __typename: 'Media' } ) | ( MediaAiringSchedule & { __typename: 'MediaAiringSchedule' } ) | ( MediaExternalLink & { __typename: 'MediaExternalLink' } ) | ( MediaTrailer & { __typename: 'MediaTrailer' } ) | ( PlaybackSource & { __typename: 'PlaybackSource' } ) | ( Resource & { __typename: 'Resource' } ) | ( Team & { __typename: 'Team' } );
  HandleConnection: ( EpisodeConnection & { __typename: 'EpisodeConnection' } ) | ( MediaConnection & { __typename: 'MediaConnection' } ) | ( PlaybackSourceConnection & { __typename: 'PlaybackSourceConnection' } ) | ( ResourceConnection & { __typename: 'ResourceConnection' } );
  HandleEdge: ( EpisodeEdge & { __typename: 'EpisodeEdge' } ) | ( MediaEdge & { __typename: 'MediaEdge' } ) | ( PlaybackSourceEdge & { __typename: 'PlaybackSourceEdge' } ) | ( ResourceEdge & { __typename: 'ResourceEdge' } );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  CountryCode: ResolverTypeWrapper<Scalars['CountryCode']['output']>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Episode: ResolverTypeWrapper<Episode>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  EpisodeConnection: ResolverTypeWrapper<EpisodeConnection>;
  EpisodeEdge: ResolverTypeWrapper<EpisodeEdge>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  EpisodeInput: EpisodeInput;
  EpisodePage: ResolverTypeWrapper<EpisodePage>;
  EpisodePageInput: EpisodePageInput;
  EpisodeSort: EpisodeSort;
  ExternalLinkMediaType: ExternalLinkMediaType;
  ExternalLinkType: ExternalLinkType;
  FuzzyDate: ResolverTypeWrapper<FuzzyDate>;
  FuzzyDateInput: FuzzyDateInput;
  FuzzyDateInt: ResolverTypeWrapper<Scalars['FuzzyDateInt']['output']>;
  Handle: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Handle']>;
  HandleConnection: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['HandleConnection']>;
  HandleEdge: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['HandleEdge']>;
  HandleRelation: HandleRelation;
  Json: ResolverTypeWrapper<Scalars['Json']['output']>;
  Media: ResolverTypeWrapper<Media>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  MediaAiringSchedule: ResolverTypeWrapper<MediaAiringSchedule>;
  MediaAiringScheduleConnection: ResolverTypeWrapper<MediaAiringScheduleConnection>;
  MediaAiringScheduleEdge: ResolverTypeWrapper<MediaAiringScheduleEdge>;
  MediaConnection: ResolverTypeWrapper<MediaConnection>;
  MediaCoverImage: ResolverTypeWrapper<MediaCoverImage>;
  MediaEdge: ResolverTypeWrapper<MediaEdge>;
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
  OriginAuthenticate: ResolverTypeWrapper<OriginAuthenticate>;
  OriginAuthenticateInput: OriginAuthenticateInput;
  OriginAuthenticateInputOauth2: OriginAuthenticateInputOauth2;
  OriginAuthenticateOauth2: ResolverTypeWrapper<OriginAuthenticateOauth2>;
  OriginAuthentication: ResolverTypeWrapper<OriginAuthentication>;
  OriginAuthenticationMethod: ResolverTypeWrapper<OriginAuthenticationMethod>;
  OriginAuthenticationMethodHeaderValue: ResolverTypeWrapper<OriginAuthenticationMethodHeaderValue>;
  OriginAuthenticationMethodHeaderValueInput: OriginAuthenticationMethodHeaderValueInput;
  OriginAuthenticationMethodType: OriginAuthenticationMethodType;
  OriginInput: OriginInput;
  OriginPageInput: OriginPageInput;
  OriginUser: ResolverTypeWrapper<OriginUser>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  OriginUserInput: OriginUserInput;
  OriginUserInputOauth2: OriginUserInputOauth2;
  PlaybackSource: ResolverTypeWrapper<PlaybackSource>;
  PlaybackSourceConnection: ResolverTypeWrapper<PlaybackSourceConnection>;
  PlaybackSourceEdge: ResolverTypeWrapper<PlaybackSourceEdge>;
  PlaybackSourceFileStructure: PlaybackSourceFileStructure;
  PlaybackSourceInput: PlaybackSourceInput;
  PlaybackSourcePage: ResolverTypeWrapper<PlaybackSourcePage>;
  PlaybackSourcePageInput: PlaybackSourcePageInput;
  PlaybackSourceType: PlaybackSourceType;
  Query: ResolverTypeWrapper<{}>;
  Resource: ResolverTypeWrapper<Resource>;
  ResourceConnection: ResolverTypeWrapper<ResourceConnection>;
  ResourceEdge: ResolverTypeWrapper<ResourceEdge>;
  Team: ResolverTypeWrapper<Team>;
  Uri: ResolverTypeWrapper<Scalars['Uri']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  CountryCode: Scalars['CountryCode']['output'];
  Date: Scalars['Date']['output'];
  Episode: Episode;
  Float: Scalars['Float']['output'];
  String: Scalars['String']['output'];
  EpisodeConnection: EpisodeConnection;
  EpisodeEdge: EpisodeEdge;
  Int: Scalars['Int']['output'];
  EpisodeInput: EpisodeInput;
  EpisodePage: EpisodePage;
  EpisodePageInput: EpisodePageInput;
  FuzzyDate: FuzzyDate;
  FuzzyDateInput: FuzzyDateInput;
  FuzzyDateInt: Scalars['FuzzyDateInt']['output'];
  Handle: ResolversInterfaceTypes<ResolversParentTypes>['Handle'];
  HandleConnection: ResolversInterfaceTypes<ResolversParentTypes>['HandleConnection'];
  HandleEdge: ResolversInterfaceTypes<ResolversParentTypes>['HandleEdge'];
  Json: Scalars['Json']['output'];
  Media: Media;
  Boolean: Scalars['Boolean']['output'];
  MediaAiringSchedule: MediaAiringSchedule;
  MediaAiringScheduleConnection: MediaAiringScheduleConnection;
  MediaAiringScheduleEdge: MediaAiringScheduleEdge;
  MediaConnection: MediaConnection;
  MediaCoverImage: MediaCoverImage;
  MediaEdge: MediaEdge;
  MediaExternalLink: MediaExternalLink;
  MediaInput: MediaInput;
  MediaPage: MediaPage;
  MediaPageInput: MediaPageInput;
  MediaSynonym: MediaSynonym;
  MediaTitle: MediaTitle;
  MediaTrailer: MediaTrailer;
  Mutation: {};
  Origin: Origin;
  OriginAuthenticate: OriginAuthenticate;
  OriginAuthenticateInput: OriginAuthenticateInput;
  OriginAuthenticateInputOauth2: OriginAuthenticateInputOauth2;
  OriginAuthenticateOauth2: OriginAuthenticateOauth2;
  OriginAuthentication: OriginAuthentication;
  OriginAuthenticationMethod: OriginAuthenticationMethod;
  OriginAuthenticationMethodHeaderValue: OriginAuthenticationMethodHeaderValue;
  OriginAuthenticationMethodHeaderValueInput: OriginAuthenticationMethodHeaderValueInput;
  OriginInput: OriginInput;
  OriginPageInput: OriginPageInput;
  OriginUser: OriginUser;
  ID: Scalars['ID']['output'];
  OriginUserInput: OriginUserInput;
  OriginUserInputOauth2: OriginUserInputOauth2;
  PlaybackSource: PlaybackSource;
  PlaybackSourceConnection: PlaybackSourceConnection;
  PlaybackSourceEdge: PlaybackSourceEdge;
  PlaybackSourceInput: PlaybackSourceInput;
  PlaybackSourcePage: PlaybackSourcePage;
  PlaybackSourcePageInput: PlaybackSourcePageInput;
  Query: {};
  Resource: Resource;
  ResourceConnection: ResourceConnection;
  ResourceEdge: ResourceEdge;
  Team: Team;
  Uri: Scalars['Uri']['output'];
};

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['CountryCode'], any> {
  name: 'CountryCode';
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type EpisodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Episode'] = ResolversParentTypes['Episode']> = {
  airingAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['EpisodeConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType>;
  mediaUri?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  number?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  playback?: Resolver<Maybe<ResolversTypes['PlaybackSourceConnection']>, ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeUntilAiring?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['MediaTitle']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EpisodeConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['EpisodeConnection'] = ResolversParentTypes['EpisodeConnection']> = {
  edges?: Resolver<Array<ResolversTypes['EpisodeEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Episode']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EpisodeEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EpisodeEdge'] = ResolversParentTypes['EpisodeEdge']> = {
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Episode'], ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EpisodePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['EpisodePage'] = ResolversParentTypes['EpisodePage']> = {
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

export type FuzzyDateResolvers<ContextType = any, ParentType extends ResolversParentTypes['FuzzyDate'] = ResolversParentTypes['FuzzyDate']> = {
  day?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  month?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  year?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface FuzzyDateIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['FuzzyDateInt'], any> {
  name: 'FuzzyDateInt';
}

export type HandleResolvers<ContextType = any, ParentType extends ResolversParentTypes['Handle'] = ResolversParentTypes['Handle']> = {
  __resolveType?: TypeResolveFn<'Episode' | 'Media' | 'MediaAiringSchedule' | 'MediaExternalLink' | 'MediaTrailer' | 'PlaybackSource' | 'Resource' | 'Team', ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type HandleConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['HandleConnection'] = ResolversParentTypes['HandleConnection']> = {
  __resolveType?: TypeResolveFn<'EpisodeConnection' | 'MediaConnection' | 'PlaybackSourceConnection' | 'ResourceConnection', ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes['HandleEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Handle']>, ParentType, ContextType>;
};

export type HandleEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['HandleEdge'] = ResolversParentTypes['HandleEdge']> = {
  __resolveType?: TypeResolveFn<'EpisodeEdge' | 'MediaEdge' | 'PlaybackSourceEdge' | 'ResourceEdge', ParentType, ContextType>;
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Handle'], ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
  name: 'Json';
}

export type MediaResolvers<ContextType = any, ParentType extends ResolversParentTypes['Media'] = ResolversParentTypes['Media']> = {
  averageScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  bannerImage?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  coverImage?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaCoverImage']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaDescriptionArgs>>;
  endDate?: Resolver<Maybe<ResolversTypes['FuzzyDate']>, ParentType, ContextType>;
  episodeCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  episodes?: Resolver<Maybe<ResolversTypes['EpisodeConnection']>, ParentType, ContextType, Partial<MediaEpisodesArgs>>;
  externalLinks?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaExternalLink']>>>, ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['MediaFormat']>, ParentType, ContextType>;
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

export type MediaAiringScheduleResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaAiringSchedule'] = ResolversParentTypes['MediaAiringSchedule']> = {
  airingAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episodeNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
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

export type MediaAiringScheduleConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaAiringScheduleConnection'] = ResolversParentTypes['MediaAiringScheduleConnection']> = {
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaAiringScheduleEdge']>>>, ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaAiringSchedule']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaAiringScheduleEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaAiringScheduleEdge'] = ResolversParentTypes['MediaAiringScheduleEdge']> = {
  node?: Resolver<Maybe<ResolversTypes['MediaAiringSchedule']>, ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaConnection'] = ResolversParentTypes['MediaConnection']> = {
  edges?: Resolver<Array<ResolversTypes['MediaEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Media']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaCoverImageResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaCoverImage'] = ResolversParentTypes['MediaCoverImage']> = {
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  default?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extraLarge?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  large?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  medium?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  small?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaEdge'] = ResolversParentTypes['MediaEdge']> = {
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Media'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaExternalLinkResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaExternalLink'] = ResolversParentTypes['MediaExternalLink']> = {
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type MediaPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaPage'] = ResolversParentTypes['MediaPage']> = {
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

export type MediaSynonymResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaSynonym'] = ResolversParentTypes['MediaSynonym']> = {
  isRomanized?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  score?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  synonym?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaTitleResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaTitle'] = ResolversParentTypes['MediaTitle']> = {
  english?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MediaTitleLanguageArgs>>;
  native?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  romanized?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userPreferred?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaTrailerResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaTrailer'] = ResolversParentTypes['MediaTrailer']> = {
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  dummy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  originAuthenticate?: Resolver<ResolversTypes['OriginAuthenticate'], ParentType, ContextType, RequireFields<MutationOriginAuthenticateArgs, 'input'>>;
};

export type OriginResolvers<ContextType = any, ParentType extends ResolversParentTypes['Origin'] = ResolversParentTypes['Origin']> = {
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

export type OriginAuthenticateResolvers<ContextType = any, ParentType extends ResolversParentTypes['OriginAuthenticate'] = ResolversParentTypes['OriginAuthenticate']> = {
  oauth2?: Resolver<Maybe<ResolversTypes['OriginAuthenticateOauth2']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OriginAuthenticateOauth2Resolvers<ContextType = any, ParentType extends ResolversParentTypes['OriginAuthenticateOauth2'] = ResolversParentTypes['OriginAuthenticateOauth2']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expiresIn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OriginAuthenticationResolvers<ContextType = any, ParentType extends ResolversParentTypes['OriginAuthentication'] = ResolversParentTypes['OriginAuthentication']> = {
  authentication?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  methods?: Resolver<Maybe<Array<ResolversTypes['OriginAuthenticationMethod']>>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['Origin'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OriginAuthenticationMethodResolvers<ContextType = any, ParentType extends ResolversParentTypes['OriginAuthenticationMethod'] = ResolversParentTypes['OriginAuthenticationMethod']> = {
  body?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  headers?: Resolver<Maybe<Array<ResolversTypes['OriginAuthenticationMethodHeaderValue']>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['OriginAuthenticationMethodType'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OriginAuthenticationMethodHeaderValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['OriginAuthenticationMethodHeaderValue'] = ResolversParentTypes['OriginAuthenticationMethodHeaderValue']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OriginUserResolvers<ContextType = any, ParentType extends ResolversParentTypes['OriginUser'] = ResolversParentTypes['OriginUser']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlaybackSourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['PlaybackSource'] = ResolversParentTypes['PlaybackSource']> = {
  bytes?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episode?: Resolver<Maybe<ResolversTypes['Episode']>, ParentType, ContextType>;
  episodeRange?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  filename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  filesCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['PlaybackSourceConnection'], ParentType, ContextType>;
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

export type PlaybackSourceConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['PlaybackSourceConnection'] = ResolversParentTypes['PlaybackSourceConnection']> = {
  edges?: Resolver<Array<ResolversTypes['PlaybackSourceEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['PlaybackSource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlaybackSourceEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['PlaybackSourceEdge'] = ResolversParentTypes['PlaybackSourceEdge']> = {
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['PlaybackSource'], ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlaybackSourcePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['PlaybackSourcePage'] = ResolversParentTypes['PlaybackSourcePage']> = {
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

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  dummy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  episode?: Resolver<Maybe<ResolversTypes['Episode']>, ParentType, ContextType, Partial<QueryEpisodeArgs>>;
  episodePage?: Resolver<Maybe<ResolversTypes['EpisodePage']>, ParentType, ContextType, Partial<QueryEpisodePageArgs>>;
  media?: Resolver<Maybe<ResolversTypes['Media']>, ParentType, ContextType, Partial<QueryMediaArgs>>;
  mediaPage?: Resolver<Maybe<ResolversTypes['MediaPage']>, ParentType, ContextType, RequireFields<QueryMediaPageArgs, 'input'>>;
  origin?: Resolver<Maybe<ResolversTypes['Origin']>, ParentType, ContextType, RequireFields<QueryOriginArgs, 'input'>>;
  originAuthentication?: Resolver<Array<ResolversTypes['OriginAuthentication']>, ParentType, ContextType>;
  originPage?: Resolver<Array<ResolversTypes['Origin']>, ParentType, ContextType, RequireFields<QueryOriginPageArgs, 'input'>>;
  originUser?: Resolver<ResolversTypes['OriginUser'], ParentType, ContextType, RequireFields<QueryOriginUserArgs, 'input'>>;
  playbackSource?: Resolver<Maybe<ResolversTypes['PlaybackSource']>, ParentType, ContextType, Partial<QueryPlaybackSourceArgs>>;
  playbackSourcePage?: Resolver<Maybe<ResolversTypes['PlaybackSourcePage']>, ParentType, ContextType, Partial<QueryPlaybackSourcePageArgs>>;
};

export type ResourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Resource'] = ResolversParentTypes['Resource']> = {
  batchResources?: Resolver<Array<ResolversTypes['ResourceConnection']>, ParentType, ContextType>;
  handles?: Resolver<ResolversTypes['ResourceConnection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isBatch?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['Uri'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResourceConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResourceConnection'] = ResolversParentTypes['ResourceConnection']> = {
  edges?: Resolver<Array<ResolversTypes['ResourceEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResourceEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResourceEdge'] = ResolversParentTypes['ResourceEdge']> = {
  handleRelationType?: Resolver<ResolversTypes['HandleRelation'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Resource'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  handles?: Resolver<ResolversTypes['HandleConnection'], ParentType, ContextType>;
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

export type Resolvers<ContextType = any> = {
  CountryCode?: GraphQLScalarType;
  Date?: GraphQLScalarType;
  Episode?: EpisodeResolvers<ContextType>;
  EpisodeConnection?: EpisodeConnectionResolvers<ContextType>;
  EpisodeEdge?: EpisodeEdgeResolvers<ContextType>;
  EpisodePage?: EpisodePageResolvers<ContextType>;
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
  MediaExternalLink?: MediaExternalLinkResolvers<ContextType>;
  MediaPage?: MediaPageResolvers<ContextType>;
  MediaSynonym?: MediaSynonymResolvers<ContextType>;
  MediaTitle?: MediaTitleResolvers<ContextType>;
  MediaTrailer?: MediaTrailerResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Origin?: OriginResolvers<ContextType>;
  OriginAuthenticate?: OriginAuthenticateResolvers<ContextType>;
  OriginAuthenticateOauth2?: OriginAuthenticateOauth2Resolvers<ContextType>;
  OriginAuthentication?: OriginAuthenticationResolvers<ContextType>;
  OriginAuthenticationMethod?: OriginAuthenticationMethodResolvers<ContextType>;
  OriginAuthenticationMethodHeaderValue?: OriginAuthenticationMethodHeaderValueResolvers<ContextType>;
  OriginUser?: OriginUserResolvers<ContextType>;
  PlaybackSource?: PlaybackSourceResolvers<ContextType>;
  PlaybackSourceConnection?: PlaybackSourceConnectionResolvers<ContextType>;
  PlaybackSourceEdge?: PlaybackSourceEdgeResolvers<ContextType>;
  PlaybackSourcePage?: PlaybackSourcePageResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Resource?: ResourceResolvers<ContextType>;
  ResourceConnection?: ResourceConnectionResolvers<ContextType>;
  ResourceEdge?: ResourceEdgeResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  Uri?: GraphQLScalarType;
};

