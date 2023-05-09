export const MediaParameters = `#graphql
    """Filter by the media id"""
    id: String
    """Filter by the media origin"""
    origin: String
    """Filter by the media uri"""
    uri: String
    """Filter by search terms"""
    search: String
    """Filter by search terms"""
    season: MediaSeason
    """
    The year of the season (Winter 2017 would also include December 2016 releases). Requires season argument
    """
    seasonYear: Int

    """Filter by the media's current release status"""
    status: MediaStatus

    """Filter by the media's current release status"""
    status_in: [MediaStatus]

    """Filter by the media's current release status"""
    status_not: MediaStatus

    """Filter by the media's current release status"""
    status_not_in: [MediaStatus]

    """Filter by the start date of the media"""
    startDate: FuzzyDateInt

    """Filter by the start date of the media"""
    startDate_greater: FuzzyDateInt

    """Filter by the start date of the media"""
    startDate_lesser: FuzzyDateInt

    """Filter by the start date of the media"""
    startDate_like: String

    """Filter by the end date of the media"""
    endDate: FuzzyDateInt

    """Filter by the end date of the media"""
    endDate_greater: FuzzyDateInt

    """Filter by the end date of the media"""
    endDate_lesser: FuzzyDateInt

    """Filter by the end date of the media"""
    endDate_like: String

    """The order the results will be returned in"""
    sort: [MediaSort]
`

export const schema = `#graphql

extend type Query {
  Media(${MediaParameters}): Media
}

"""
Media is a type of handle that represents a media.
It generally represents a Movie, TV Show, Game, Package, ect...
"""
type Media implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: MediaConnection!

  # Media properties
  """The official titles of the media in various languages"""
  title: MediaTitle

  """Alternative titles of the media"""
  synonyms: [MediaSynonym]
  
  """The type of the media"""
  type: MediaType

  """The current releasing status of the media"""
  status: MediaStatus

  """External links to another site related to the media"""
  externalLinks: [MediaExternalLink]

  """Media trailer or advertisement"""
  trailers: [MediaTrailer]

  """The cover images of the media"""
  coverImage: [MediaCoverImage]

  """The banner image of the media"""
  bannerImage: [String]

  """The average score of the media"""
  averageScore: Int

  """The number of users with the media on their list"""
  popularity: Int

  """Short description of the media's story and characters"""
  shortDescription(
    """Return the string in pre-parsed html instead of markdown"""
    asHtml: Boolean
  ): String

  """Long description of the media's story and characters"""
  description(
    """Return the string in pre-parsed html instead of markdown"""
    asHtml: Boolean
  ): String

  format: MediaFormat

  """The season the media was initially released in"""
  season: MediaSeason

  """The season year the media was initially released in"""
  seasonYear: Int

  """If the media is intended only for 18+ adult audiences"""
  isAdult: Boolean

  """The first official release date of the media"""
  startDate: FuzzyDate

  """The last official release date of the media"""
  endDate: FuzzyDate

  episodes(
    """Filter to episodes that have not yet aired"""
    notYetAired: Boolean

    """The page"""
    page: Int

    """The amount of entries per page, max 25"""
    perPage: Int
  ): MediaEpisodeConnection

  # """The media's entire airing schedule"""
  # airingSchedule(
  #   """Filter to episodes that have not yet aired"""
  #   notYetAired: Boolean

  #   """The page"""
  #   page: Int

  #   """The amount of entries per page, max 25"""
  #   perPage: Int
  # ): MediaAiringScheduleConnection
}

type MediaEpisode implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: HandleConnection!

  # MediaEpisode properties
  """The time the episode airs at"""
  airingAt: Float!

  """The episode number"""
  number: Int!

  """The title of the episode"""
  title: MediaTitle

  """The description of the episode"""
  description: String

  """The url for the thumbnail image of the video"""
  thumbnail: String

  """The associate media of the episode"""
  media: Media

  """The associate media uri of the episode"""
  mediaUri: String!

  """Seconds until episode starts airing"""
  timeUntilAiring: Float!
}

type MediaEpisodeConnection {
  edges: [MediaEpisodeEdge]
  nodes: [MediaEpisode]

  """The pagination information"""
  pageInfo: PageInfo
}

"""MediaEpisode connection edge"""
type MediaEpisodeEdge {
  node: MediaEpisode
}

"""
Media Airing Schedule. NOTE: We only aim to guarantee that FUTURE airing data is present and accurate.
"""
type MediaAiringSchedule implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: HandleConnection!

  # MediaAiringSchedule properties
  """The time the episode airs at"""
  airingAt: Float!

  """The airing episode number"""
  episodeNumber: Int!

  """The associate media of the airing episode"""
  media: Media

  """The associate media uri of the airing episode"""
  mediaUri: String!

  """Seconds until episode starts airing"""
  timeUntilAiring: Float!

  """The url for the thumbnail image of the video"""
  thumbnail: String

  """The title of the episode"""
  title: MediaTitle

  """The description of the episode"""
  description: String
}

type MediaAiringScheduleConnection {
  edges: [MediaAiringScheduleEdge]
  nodes: [MediaAiringSchedule]

  """The pagination information"""
  pageInfo: PageInfo
}

"""MediaAiringSchedule connection edge"""
type MediaAiringScheduleEdge {
  """The uri of the connection"""
  uri: Int
  node: MediaAiringSchedule
}

type MediaEdge implements HandleEdge {
  node: Media!

  """The relation between the two handles"""
  handleRelationType: HandleRelation!
}

type MediaConnection implements HandleConnection {
  edges: [MediaEdge!]!
  nodes: [Media!]!

  """The pagination information"""
  pageInfo: PageInfo
}

"""The cover images of the media"""
type MediaCoverImage {
  """Average #hex color of cover image"""
  color: String

  """The cover image of the media by default. Using highest resolution available."""
  default: String

  """The cover image of the media at its largest size. 500x735"""
  extraLarge: String

  """The cover image of the media at large size. 250x367"""
  large: String

  """The cover image of the media at medium size. 120x171"""
  medium: String

  """The cover image of the media at small size. 64x92"""
  small: String
}

"""An external link to another site related to the media or its properties"""
type MediaExternalLink implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: HandleConnection!

  # MediaExternalLink properties
  color: String

  """The icon image url of the site. Not available for all links"""
  icon: String

  isDisabled: Boolean

  """Language the site content is in"""
  language: String
  notes: String

  type: ExternalLinkType
}

"""Media trailer or advertisement"""
type MediaTrailer implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: HandleConnection!

  # MediaTrailer properties
  """The url for the thumbnail image of the video"""
  thumbnail: String
}

"""The type of the media"""
enum MediaType {
  """Asian comic book"""
  MANGA

  """Written work published in volumes"""
  LIGHT_NOVEL

  """Video game driven primary by text and narrative"""
  VISUAL_NOVEL

  """Video game"""
  VIDEO_GAME

  """Other"""
  OTHER

  """Written works not published in volumes"""
  NOVEL

  """Self-published works"""
  DOUJINSHI

  """Japanese Anime"""
  ANIME

  """Media broadcast on television"""
  TV

  """Media which are under 15 minutes in length and broadcast on television"""
  TV_SHORT

  """Movies with a theatrical release"""
  MOVIE

  """
  Special episodes that have been included in DVD/Blu-ray releases, pilots, etc
  """
  SPECIAL
  
  """
  (Original Video Animation) Anime that have been released directly on
  DVD/Blu-ray without originally going through a theatrical release or
  television broadcast
  """
  OVA

  """
  (Original Net Animation) Anime that have been originally released online or are only available through streaming services.
  """
  ONA

  """Manga with just one chapter"""
  ONE_SHOT

  """Short anime released as a music video"""
  MUSIC

  """Video"""
  VIDEO

  """Written works published online"""
  WEB_NOVEL

  """Live action media such as movies or TV show"""
  LIVE_ACTION

  """Games excluding video games"""
  GAME

  """Comics excluding manga"""
  COMIC

  """Multimedia project"""
  MULTIMEDIA_PROJECT

  """Picture book"""
  PICTURE_BOOK

  """Software"""
  SOFTWARE
}

"""The format the media was released in"""
enum MediaFormat {
  """Anime broadcast on television"""
  TV

  """Anime which are under 15 minutes in length and broadcast on television"""
  TV_SHORT

  """Anime movies with a theatrical release"""
  MOVIE

  """
  Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc
  """
  SPECIAL

  """
  (Original Video Animation) Anime that have been released directly on
  DVD/Blu-ray without originally going through a theatrical release or
  television broadcast
  """
  OVA

  """
  (Original Net Animation) Anime that have been originally released online or are only available through streaming services.
  """
  ONA

  """Short anime released as a music video"""
  MUSIC

  """Professionally published manga with more than one chapter"""
  MANGA

  """Written books released as a series of light novels"""
  NOVEL

  """Manga with just one chapter"""
  ONE_SHOT
}

"""Source type the media was adapted from"""
enum MediaSource {
  """An original production not based of another work"""
  ORIGINAL

  """Asian comic book"""
  MANGA

  """Written work published in volumes"""
  LIGHT_NOVEL

  """Video game driven primary by text and narrative"""
  VISUAL_NOVEL

  """Video game"""
  VIDEO_GAME

  """Other"""
  OTHER

  """Written works not published in volumes"""
  NOVEL

  """Self-published works"""
  DOUJINSHI

  """Japanese Anime"""
  ANIME

  """Written works published online"""
  WEB_NOVEL

  """Live action media such as movies or TV show"""
  LIVE_ACTION

  """Games excluding video games"""
  GAME

  """Comics excluding manga"""
  COMIC

  """Multimedia project"""
  MULTIMEDIA_PROJECT

  """Picture book"""
  PICTURE_BOOK
}

enum MediaSeason {
  """Months December to February"""
  WINTER

  """Months March to May"""
  SPRING

  """Months June to August"""
  SUMMER

  """Months September to November"""
  FALL
}

"""The current releasing status of the media"""
enum MediaStatus {
  """Has completed and is no longer being released"""
  FINISHED

  """Currently releasing"""
  RELEASING

  """To be released at a later date"""
  NOT_YET_RELEASED

  """Ended before the work could be finished"""
  CANCELLED

  """Is currently paused from releasing and will resume at a later date"""
  HIATUS
}

"""The official titles of the media in various languages"""
type MediaTitle {
  """The official english title"""
  english: String

  """Official title in it's native language"""
  native: String

  """Official title in it's romanized form"""
  romanized: String

  """The official language title"""
  language(countryCode: CountryCode): String

  """The currently authenticated users preferred title language. Default english"""
  userPreferred: String
}

"""Alternative titles of the media"""
type MediaSynonym {
  """The language the title is in"""
  language: String

  """The alternative title"""
  synonym: String

  """Is alternative title a romanized version of the native title"""
  isRomanized: Boolean

  """The score of the title based on searchability"""
  score: Float
}

enum MediaSort {
  ID
  ID_DESC
  TITLE_ROMANIZED
  TITLE_ROMANIZED_DESC
  TITLE_ENGLISH
  TITLE_ENGLISH_DESC
  TITLE_NATIVE
  TITLE_NATIVE_DESC
  TYPE
  TYPE_DESC
  FORMAT
  FORMAT_DESC
  START_DATE
  START_DATE_DESC
  END_DATE
  END_DATE_DESC
  SCORE
  SCORE_DESC
  POPULARITY
  POPULARITY_DESC
  STATUS
  STATUS_DESC
  SEARCH_MATCH
}

`
