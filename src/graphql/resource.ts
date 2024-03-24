export const schema = `#graphql

type Resource implements Handle {
  _id: String
  # Handle properties
  origin: String!
  id: String!
  uri: Uri!
  url: String
  handles: [Resource!]!

  # Resource properties
  isBatch: Boolean
  batchResources: [Resource!]!
}

`
