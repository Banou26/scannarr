import type { HandleConnection } from '../generated/graphql'

export const getEdges = (handleConnection: HandleConnection) =>
  handleConnection?.edges
  ?? handleConnection?.nodes.map((node) => ({ node }))
  ?? []

export const getNodes = (handleConnection: HandleConnection) =>
  handleConnection?.edges.map(edge => edge.node)
  ?? handleConnection?.nodes
  ?? []
