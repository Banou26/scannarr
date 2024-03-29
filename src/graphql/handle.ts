export const schema = `#graphql

""" A Handle represents a unique identifier for a resource. """
interface Handle {
  _id: String
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

  handles: [Handle!]!
}

`
