export const schema = `#graphql

""" A Handle represents a unique identifier for a resource. """
interface Handle {
  """ The name of the handler, e.g: 'fkn' for packages handled by FKN """
  handler: String!
  """ The origin of the resource, e.g: 'npm', generally the host of the resource """
  origin: String!
  """ The id of the resource, e.g: 'react' for the React package """
  id: String!
  """
  The uri of the resource.
  An uri is the combination of the handler, the origin and the id
  e.g: 'fkn:npm:react' for the React package
  """
  uri: Uri!
  """ The URL of the resource, e.g: 'https://npmjs.com/package/react' """
  url: String

  handles: [HandleConnection!]!
}

interface HandleEdge {
  node: Handle!
}

interface HandleConnection {
  edges: [HandleEdge]
  nodes: [Handle]

  """The pagination information"""
  pageInfo: PageInfo
}

`
