const typeDefs = `#graphql

directive @defer(if: Boolean, label: String) on FRAGMENT_SPREAD | INLINE_FRAGMENT
directive @stream(if: Boolean, label: String, initialCount: Int = 0) on FIELD

scalar Uri
scalar Date
scalar JSON

interface Handle {
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Handle!]!
}

interface Title implements Handle {
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Handle!]!
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  handles: [TitleHandle!]!
  images: [ImageData!]!
  names: [Name!]!
  number: Int
  recommendations: [Title!]!
  relations: [Relation!]!
  series: Series
  synopses: [Synopsis!]!
  unit: Int
}

type TitleHandle implements Handle {
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Handle!]!
  averageScore: Float
  batch: Boolean
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  description: String
  handles: [TitleHandle!]!
  images: [ImageData!]!
  names: [Name!]!
  number: Int
  numbers: [Int!]!
  recommendations: [TitleHandle!]!
  relations: [Relation!]!
  resolution: Resolution
  series: SeriesHandle
  size: Int
  synopses: [Synopsis!]!
  tags: [Tag!]!
}

type Series implements Handle {
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Handle!]!
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  handles: [SeriesHandle!]!
  images: [ImageData!]!
  names: [Name!]!
  recommendations: [Series!]!

  relations: [Relation!]!
  synopses: [Synopsis!]!
  titles: [Title!]!
}

type SeriesHandle implements Handle {
  handler: String!
  origin: String!
  id: String!

  uri: Uri!
  url: String
  handles: [Handle!]!
  averageScore: Float
  categories: [Category!]!
  comments: [Comment!]!
  dates: [DateData!]!
  description: String
  handles: [SeriesHandle!]!
  images: [ImageData!]!
  names: [Name!]!
  recommendations: [SeriesHandle!]!
  relations: [Relation!]!
  resolution: Resolution
  size: Int
  synopses: [Synopsis!]!
  tags: [Tag!]!
  titles: [TitleHandle!]!
}

type Category {
  id: String!
  name: String!
  uri: Uri!
}

type Comment {
  date: Date
  message: String!
  url: String
  user: User!
}

type DateData {
  date: Date!
  type: String!

}

type ImageData {
  url: String!
  type: String!
}

type Name {
  name: String!
  type: String!
}

type Relation<T> {
  relation: String!
  target: T!
}

type Synopsis {
  synopsis: String!
  type: String!
}

type Tag {
  tag: String!
  type: String!
}

type Resolution {
  width: Int!
  height: Int!
}

type User {
  id: String!
  name: String!
  url: String
}

type Package {
  id: String!
  name: String!
  version: String!
  description: String
  url: String
  date: Date
  size: Int
  origin: String
  handles: [Handle!]!
}

type Genre {
  id: String!
  name: String!
  url: String
  handles: [Handle!]!
}




extend type Query {
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
