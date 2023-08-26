

export const OriginParameters = `#graphql
    """Filter by the media id"""
    id: String
    """Filter by the media origin"""
    name: String
    """Filter by if the origin is official"""
    official: Boolean
    """Filter by if the origin only returns metadata"""
    metadataOnly: Boolean
    """Filter by origin categories"""
    categories: [MediaType!]
`

// This is used the origin page query
export const OriginsParameters = `#graphql
    """Filter by the media id"""
    ids: [String!]
    """Filter by the media origin"""
    names: [String!]
    """Filter by if the origin is official"""
    official: Boolean
    """Filter by if the origin only returns metadata"""
    metadataOnly: Boolean
    """Filter by origin categories"""
    categories: [MediaType!]
`

export const schema = `#graphql

extend type Query {
  Origin(${OriginParameters}): Origin
}

"""
Media is a type of handle that represents a media.
It generally represents a Movie, TV Show, Game, Package, ect...
"""
type Origin {
  """Origin ID, e.g: "nflx" for Netflix"""
  id: String!

  """Origin ID, e.g: "nflx" for Netflix"""
  origin: String!

  """The icon URL"""
  icon: String

  """Origin full name, e.g: "Netflix" """
  name: String!

  """The origin's URL, e.g "https://www.netflix.com/"" """
  url: String
  
  """The media types of the target"""
  categories: [MediaType!]!

  """If the origin is official, e.g a legal redistributor or platform"""
  official: Boolean

  """If the origin returns metadata only, e.g no playback or download data"""
  metadataOnly: Boolean

  supportedUris: [String!]
}

`
