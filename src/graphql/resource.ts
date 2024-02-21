export const schema = `#graphql

type Resource implements Handle {
  # Handle properties
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: ResourceConnection!

  # Resource properties
  isBatch: Boolean
  batchResources: [ResourceConnection!]!
}

type ResourceEdge implements HandleEdge {
  node: Resource!

  """The relation between the two handles"""
  handleRelationType: HandleRelation!
}

type ResourceConnection implements HandleConnection {
  edges: [ResourceEdge!]!
  nodes: [Resource!]!
}

`
