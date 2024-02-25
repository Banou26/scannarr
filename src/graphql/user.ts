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

extend type Query {
  originUser(input: OriginUserInput!): OriginUser!
  originAuthentication: [OriginAuthentication!]!
}

extend type Mutation {
  originAuthenticate(input: OriginAuthenticateInput!): OriginAuthenticate!
}

`
