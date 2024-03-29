export const schema = `#graphql

enum AuthenticationMethodType {
  OAUTH2
}

type AuthenticationMethodHeaderValue {
  key: String!
  value: String!
}

type AuthenticationMethod {
  type: AuthenticationMethodType!

  url: String
  headers: [AuthenticationMethodHeaderValue!]
  body: String
}

type Authentication {
  origin: Origin!
  authentication: Boolean
  methods: [AuthenticationMethod!]
}

input AuthenticationMethodHeaderValueInput {
  key: String!
  value: String!
}

input AuthenticateInputOauth2 {
  clientId: String!
  authorizationCode: String!
  codeVerifier: String!
  grantType: String!
  redirectUri: String!
}

input AuthenticateInput {
  origin: String!
  type: AuthenticationMethodType!

  # OAUTH2
  oauth2: AuthenticateInputOauth2
}

type AuthenticateOauth2 {
  # OAUTH2
  accessToken: String!
  refreshToken: String!
  expiresIn: Int!
  tokenType: String!
}

type Authenticate {
  oauth2: AuthenticateOauth2
}

input UserInputOauth2 {
  accessToken: String!
  tokenType: String!
}

input UserInput {
  origin: String!
  type: AuthenticationMethodType!
  oauth2: UserInputOauth2
}

input UserMediaPageInputAuthentication {
  origin: String!
  type: AuthenticationMethodType!
  oauth2: UserInputOauth2
}

"""The current releasing status of the media"""
enum UserMediaStatus {
  """Currently watching"""
  WATCHING

  """Has completed"""
  COMPLETED

  """Put on hold"""
  ON_HOLD

  """Dropped"""
  DROPPED

  """Planning to watch"""
  PLAN_TO_WATCH
}

input UserMediaPageInput {
  status: [UserMediaStatus!]
  authentications: [UserMediaPageInputAuthentication!]!
}

type UserMediaPage {
  """The current page"""
  previousPageCursor: String

  """The current page"""
  currentPageCursor: String

  """The current page"""
  nextPageCursor: String

  """The first page"""
  firstPageCursor: String

  """The last page cursor"""
  lastPageCursor: String

  """Total number of items on the current page"""
  inPage: Int

  """
  The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic
  """
  total: Int

  """Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic"""
  totalBefore: Int

  """Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic"""
  totalAfter: Int

  """The media page nodes"""
  nodes: [UserMedia!]!
}

input UserMediaPageInput {
  status: [UserMediaStatus!]
  authentications: [UserMediaPageInputAuthentication!]!
}

type UserMediaEpisode {
  uri: Uri!
  episode: Episode!
  watched: Boolean!
  progress: Float
  origin: Origin!
}

type UserMedia {
  _id: String
  # Handle properties
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Media!]!

  media: Media!
  status: UserMediaStatus!
  isRewatching: Boolean
  rewatchCount: Int
  score: Float
  progress: Int
  updatedAt: Float
  episodes: [UserMediaEpisode!]!
}

type User {
  id: ID!
  username: String!
  email: String
  avatar: String
}

extend type Query {
  user(input: UserInput!): User!
  authentications: [Authentication!]!
}

input UserMediaInput {
  uri: Uri!
  authentications: [UserMediaPageInputAuthentication!]!
}

extend type Subscription {
  # userMedia(input: UserMediaInput!): UserMedia
  userMediaPage(input: UserMediaPageInput!): UserMediaPage
}

input UpdateUserMediaInput {
  origin: String!
  mediaUri: Uri!
  status: UserMediaStatus
  isRewatching: Boolean
  rewatchCount: Int
  score: Float
  progress: Int
  
  authentications: [UserMediaPageInputAuthentication!]!
}

extend type Mutation {
  authenticate(input: AuthenticateInput!): Authenticate!

  updateUserMedia(input: UpdateUserMediaInput!): UserMedia!
}

`
