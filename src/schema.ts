const typeDefs = `#graphql

directive @defer(if: Boolean, label: String) on FRAGMENT_SPREAD | INLINE_FRAGMENT
directive @stream(if: Boolean, label: String, initialCount: Int = 0) on FIELD

scalar Uri
scalar Date
scalar JSON

type PageInfo {
  """The current page cursor"""
  currentPageCursor: String

  """If there is another page"""
  hasNextPage: Boolean

  """The last page cursor"""
  lastPageCursor: Int

  """The count on a page"""
  perPage: Int

  """
  The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic
  """
  total: Int
}

type MediaConnection {
  edges: [MediaEdge]
  nodes: [Media]

  """The pagination information"""
  pageInfo: PageInfo
}


"""Media connection edge"""
type MediaEdge {
  """Media specific character name"""
  characterName: String

  """The characters role in the media"""
  characterRole: CharacterRole

  """The characters in the media voiced by the parent actor"""
  characters: [Character]

  """
  Used for grouping roles where multiple dubs exist for the same language. Either dubbing company name or language variant.
  """
  dubGroup: String

  """The order the media should be displayed from the users favourites"""
  favouriteOrder: Int

  """The id of the connection"""
  id: Int

  """
  If the studio is the main animation studio of the media (For Studio->MediaConnection field only)
  """
  isMainStudio: Boolean!
  node: Media

  """The type of relation to the parent model"""
  relationType(
    """Provide 2 to use new version 2 of relation enum"""
    version: Int
  ): MediaRelation

  """Notes regarding the VA's role for the character"""
  roleNotes: String

  """The role of the staff member in the production of the media"""
  staffRole: String

  """The voice actors of the character with role date"""
  voiceActorRoles(language: StaffLanguage, sort: [StaffSort]): [StaffRoleType]

  """The voice actors of the character"""
  voiceActors(language: StaffLanguage, sort: [StaffSort]): [Staff]
}


enum MediaType {
  AUDIO
  MOVIE
  SHOW
  ANIME
  CARTOON
  DOCUMENTARY
  PORNOGRAPHY
  BOOK
  MANGA
  WEBTOON
  COMICS
  OTHER
}

interface Handle {
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Handle!]!
}

interface Genre {
  adult: Boolean
  amount: Int
  name: String!
}

interface Name {
  language: String
  name: String!
  score: Float
}

interface Resource {
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  images: [ImageData!]!
  names: [Name!]!
  recommendations: [Resource!]!
  relations: [Relation!]!
  synopses: [Synopsis!]!
}

# An media is a single media item, contained in a series, a collection or a sequence of medias.
# A few examples of medias are:
#  - Tv show media
#  - Manga chapter
#  - Book chapter
#  - Movie
#  - Music track
#  - Webtoon chapter
# Disambiguation:
# https://en.wikipedia.org/wiki/Media
# https://en.wikipedia.org/wiki/Chapter_(books)
# https://en.wikipedia.org/wiki/Title_(publishing)
# https://en.wikipedia.org/wiki/Sequence
interface Media implements Handle & Resource {
  # Handle
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Media!]!

  # Resource
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  images: [ImageData!]!
  names: [Name!]!
  recommendations: [Resource!]!
  relations: [Relation!]!
  synopses: [Synopsis!]!
  description: String
  # Media number (inside of the unit, if there's any)
  # Generally a tv show media number or a manga's chapter number
  # Might be undefined for movies, ect...
  number: Int
  # Known number of medias/chapters
  # Might be undefined for movies, ect...
  numbers: [Int!]!
  # Usually refers to a tv show's season number or a book's number in a book series, if there's any
  # If anyone has a better general name, we could change it to something that makes more sense
  unit: Int
  resolution: Resolution
  size: Int
  tags: [Tag!]!
}

# type TitleHandle implements Handle & Resource {
#   handler: String!
#   origin: String!
#   id: String!
#   uri: Uri!
#   url: String
#   handles: [Handle!]!
#   averageScore: Float
#   batch: Boolean
#   categories: [Category!]!
#   comments: [Comment!]!
#   dates: [DateData!]!
#   description: String
#   handles: [TitleHandle!]!
#   images: [ImageData!]!
#   names: [Name!]!
#   number: Int
#   numbers: [Int!]!
#   recommendations: [TitleHandle!]!
#   relations: [Relation!]!
#   resolution: Resolution
#   series: SeriesHandle
#   size: Int
#   synopses: [Synopsis!]!
#   tags: [Tag!]!
# }


# A series is a collection or sequence of medias that are related to each other
# It is a creative work, or a sequence of creative works
# A few examples of series are:
#  - Tv show
#  - Manga
#  - Book series
#  - Movie series
#  - Video game series
#  - Comic book series
#  - Webtoon series
#  - Music album
# Disambiguation:
#  - https://en.wikipedia.org/wiki/Series
#  - https://en.wikipedia.org/wiki/Creative_work
#  - https://en.wikipedia.org/wiki/Sequence
interface Series {

}

enum ResourceType {
  MEDIA
  SERIES
}

input SearchInput {
  type: ResourceType!
}

extend type Query {
  search(type: ResourceType!, search: String!): [Handle!]!
  searchPackages(origin: String, search: String!): [Package!]!
  package(uri: Uri!): Package
}

type Query {
  dummy: String
}
type Mutation {
  dummy: String
}
type Subscription {
  dummy: String
}
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

`

export default typeDefs
