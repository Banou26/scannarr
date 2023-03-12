const typeDefs = `#graphql

directive @defer(if: Boolean, label: String) on FRAGMENT_SPREAD | INLINE_FRAGMENT
directive @stream(if: Boolean, label: String, initialCount: Int = 0) on FIELD

scalar Uri
scalar Date
scalar JSON

enum Category {
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

interface Media {
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  images: [ImageData!]!
  names: [Name!]!
  recommendations: [Media!]!
  relations: [Relation!]!
  synopses: [Synopsis!]!
}

# An episode is a single media item, contained in a series, a collection or a sequence of episodes.
# A few examples of episodes are:
#  - Tv show episode
#  - Manga chapter
#  - Book chapter
#  - Movie
#  - Music track
#  - Webtoon chapter
# Disambiguation:
# https://en.wikipedia.org/wiki/Episode
# https://en.wikipedia.org/wiki/Chapter_(books)
# https://en.wikipedia.org/wiki/Title_(publishing)
# https://en.wikipedia.org/wiki/Sequence
interface Episode implements Handle & Media {
  # Handle
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Episode!]!

  # Media
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  images: [ImageData!]!
  names: [Name!]!
  recommendations: [Media!]!
  relations: [Relation!]!
  synopses: [Synopsis!]!
  description: String
  # Episode number (inside of the unit, if there's any)
  # Generally a tv show episode number or a manga's chapter number
  # Might be undefined for movies, ect...
  number: Int
  # Known number of episodes/chapters
  # Might be undefined for movies, ect...
  numbers: [Int!]!
  # Usually refers to a tv show's season number or a book's number in a book series, if there's any
  # If anyone has a better general name, we could change it to something that makes more sense
  unit: Int
  resolution: Resolution
  size: Int
  tags: [Tag!]!
}

# type TitleHandle implements Handle & Media {
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


# A series is a collection or sequence of episodes that are related to each other
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
  EPISODE
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
