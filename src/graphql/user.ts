export const schema = `#graphql

enum OriginAuthenticationMethodType {
  OAUTH2
}

type OriginAuthenticationMethodHeaderValue {
  key: String!
  value: String!
}

type OriginAuthenticationMethod {
  type: OriginAuthenticationMethodType!

  url: String
  headers: [OriginAuthenticationMethodHeaderValue!]
  body: String
}

type OriginAuthentication {
  origin: Origin!
  authentication: Boolean
  methods: [OriginAuthenticationMethod!]
}

input OriginAuthenticationMethodHeaderValueInput {
  key: String!
  value: String!
}

input OriginAuthenticateInputOauth2 {
  clientId: String!
  authorizationCode: String!
  codeVerifier: String!
  grantType: String!
  redirectUri: String!
}

input OriginAuthenticateInput {
  origin: String!
  type: OriginAuthenticationMethodType!

  # OAUTH2
  oauth2: OriginAuthenticateInputOauth2
}

type OriginAuthenticateOauth2 {
  # OAUTH2
  accessToken: String!
  refreshToken: String!
  expiresIn: Int!
  tokenType: String!
}

type OriginAuthenticate {
  oauth2: OriginAuthenticateOauth2
}

type OriginUser {
  id: ID!
  username: String!
  email: String
  avatar: String
}

input OriginUserInputOauth2 {
  accessToken: String!
  tokenType: String!
}

input OriginUserInput {
  origin: String!
  type: OriginAuthenticationMethodType!
  oauth2: OriginUserInputOauth2
}

input OriginUserMediaPageInputAuthentication {
  origin: String!
  type: OriginAuthenticationMethodType!
  oauth2: OriginUserInputOauth2
}

"""The current releasing status of the media"""
enum OriginUserMediaStatus {
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

input OriginUserMediaPageInput {
  status: [OriginUserMediaStatus!]
  authentications: [OriginUserMediaPageInputAuthentication!]!
}

type OriginUserMediaPage {
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
  nodes: [Media!]!
}

extend type Query {
  originUser(input: OriginUserInput!): OriginUser!
  originUserMediaPage(input: OriginUserMediaPageInput!): OriginUserMediaPage!
  originAuthentication: [OriginAuthentication!]!
}

extend type Mutation {
  originAuthenticate(input: OriginAuthenticateInput!): OriginAuthenticate!
}

`
