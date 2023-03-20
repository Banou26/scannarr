export default `#graphql

type Resource implements Handle {
  # Handle properties
  handler: String!
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [ResourceConnection!]!

  # Resource properties
  isBatch: Boolean
  batchResources: [ResourceConnection!]!
}

type ResourceEdge implements HandleEdge {
  node: Resource!
}

type ResourceConnection implements HandleConnection {
  edges: [ResourceEdge]
  nodes: [Resource]

  """The pagination information"""
  pageInfo: PageInfo
}

`
