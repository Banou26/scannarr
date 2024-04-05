import type { InternalNode, NodeData } from './index'
import { toPathEntry } from './path'
import { QuerySelectors } from './query'

type Indexer = {
  shouldBeUsed: (filter: QuerySelectors) => boolean
  find: (filter: QuerySelectors) => InternalNode<NodeData>[]
  findOne: (filter: QuerySelectors) => InternalNode<NodeData> | undefined
  insertOne: (node: InternalNode<NodeData>) => void
  updateOne: (node: InternalNode<NodeData>, previousData: NodeData, newData: NodeData) => void
  removeOne: (node: InternalNode<NodeData>) => void
}

export const makePropertyIndexer = (propertyPath: string): Indexer => {
  const nodesMap = new Map<string, InternalNode<NodeData>[]>()
  return {
    __graph_type__: 'Indexer' as const,
    __propertyPath__: propertyPath,
    shouldBeUsed: (filter) => {
      const { target, key } = toPathEntry(filter, propertyPath)
      return key in target
    },
    find: (filter) => {
      const { target, key } = toPathEntry(filter, propertyPath)
      if (key in target) {
        return nodesMap.get(target[key]) ?? []
      }
      return []
    },
    findOne: (filter) => {
      const { target, key } = toPathEntry(filter, propertyPath)
      if (key in target) {
        return nodesMap.get(target[key])?.[0]
      }
    },
    insertOne: (node) => {
      const { target, key } = toPathEntry(node.data, propertyPath)
      nodesMap.set(
        target[key],
        [
          ...nodesMap.get(target[key]) ?? [],
          node
        ]
      )
    },
    updateOne: (node, previousData, newData) => {
      const { target, key } = toPathEntry(previousData, propertyPath)
      const { target: newTarget, key: newKey } = toPathEntry(newData, propertyPath)
      if (target[key] === newTarget[newKey]) return

      nodesMap.set(
        target[key],
        (nodesMap.get(target[key]) ?? []).filter(_node => _node._id !== node._id)
      )
      nodesMap.set(
        newTarget[newKey],
        [
          ...nodesMap.get(newTarget[newKey]) ?? [],
          node
        ]
      )
    },
    removeOne: (node) => {
      const { target, key } = toPathEntry(node.data, propertyPath)
      nodesMap.set(
        target[key],
        (nodesMap.get(target[key]) ?? []).filter(_node => _node._id !== node._id)
      )
    }
  }
}
