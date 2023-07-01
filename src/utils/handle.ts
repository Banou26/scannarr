import type { ReadFieldFunction } from '@apollo/client/cache/core/types/common'

import type { Handle, HandleConnection, HandleEdge } from '../generated/graphql'

export const getEdges = (handleConnection: HandleConnection, readField?: ReadFieldFunction) => {
  if (!readField) {
    return (
      handleConnection?.edges
      ?? handleConnection?.nodes.map((node) => ({ node }))
      ?? []
    )
  }
  return (
    readField<HandleEdge[]>('edges', handleConnection)
    ?? readField<Handle[]>('nodes', handleConnection)?.map((node) => ({ node }))
    ?? []
  )
}

export const getNodes = (handleConnection: HandleConnection, readField?: ReadFieldFunction) => {
  if (!readField) {
    return (
      handleConnection?.edges.map(edge => edge.node)
      ?? handleConnection?.nodes
      ?? []
    )
  }
  return (
    readField<HandleEdge[]>('edges', handleConnection)?.map(edge => edge.node)
    ?? readField<Handle[]>('nodes', handleConnection)
    ?? []
  )
}

