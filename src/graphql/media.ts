export default `#graphql

extend type Query {
  Media: Media
}

"""
Media is a type of handle that represents a media file.
It generally represents a Movie, TV Show, Game, Package, ect...
"""
type Media implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [MediaConnection!]!

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

  """Short description of the media's story and characters"""
  description(
    """Return the string in pre-parsed html instead of markdown"""
    asHtml: Boolean
  ): String
}

type MediaEdge implements HandleEdge {
  node: Media!
}

type MediaConnection implements HandleConnection {
  edges: [MediaEdge]
  nodes: [Media]

  """The pagination information"""
  pageInfo: PageInfo
}

"""The cover images of the media"""
type MediaCoverImage {
  """Average #hex color of cover image"""
  color: String

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
  handles: [HandleConnection!]!

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
  handles: [HandleConnection!]!

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
  synonyms: String

  """The score of the title based on searchability"""
  score: Float
}

`
