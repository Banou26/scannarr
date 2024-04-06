import type { InternalNode, NodeData } from './index'
import { filterPathPartToTarget, pathToKey, pathToTarget, pathToValue } from './path'
import { QuerySelectors } from './query'

type Indexer = {
  __graph_type__: 'Indexer'
  __propertyPath__?: string
  shouldBeUsedOnFilter: (filter: QuerySelectors) => boolean
  shouldBeUsedOnNode: (data: NodeData) => boolean
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
    shouldBeUsedOnFilter: (filter) => propertyPath in filter,
    shouldBeUsedOnNode: (node) => {
      const key = pathToKey(propertyPath)
      const value = pathToTarget(node, propertyPath)

      if (Array.isArray(value)) return true

      return value && key in value
    },
    find: (filter) => nodesMap.get(filter[propertyPath]) ?? [],
    findOne: (filter) => nodesMap.get(filter[propertyPath])?.[0],
    insertOne: (node) => {
      const key = pathToKey(propertyPath)
      const value = pathToTarget(node.data, propertyPath)

      if (Array.isArray(value)) {
        value.forEach(value => {
          nodesMap.set(
            value,
            [
              ...nodesMap.get(value) ?? [],
              node
            ]
          )
        })
        return
      }

      nodesMap.set(
        value[key],
        [
          ...nodesMap.get(value[key]) ?? [],
          node
        ]
      )
    },
    updateOne: (node, previousData, newData) => {
      const value = pathToValue(previousData, propertyPath)
      const newValue = pathToValue(newData, propertyPath)
      // todo: handle cases like array values which would never be equal
      if (value === newValue) return

      if (Array.isArray(value)) {
        value.forEach(value => {
          nodesMap.set(
            value,
            (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
          )
        })
        newValue.forEach(value => {
          nodesMap.set(
            value,
            [
              ...nodesMap.get(value) ?? [],
              node
            ]
          )
        })
        return
      }

      if (Array.isArray(newValue)) {
        newValue.forEach(value => {
          nodesMap.set(
            value,
            [
              ...nodesMap.get(value) ?? [],
              node
            ]
          )
        })
        return
      }

      nodesMap.set(
        value,
        (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
      )
    },
    removeOne: (node) => {
      const value = pathToValue(node.data, propertyPath)

      if (Array.isArray(value)) {
        value.forEach(value => {
          nodesMap.set(
            value,
            (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
          )
        })
        return
      }

      nodesMap.set(
        value,
        (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
      )
    }
  }
}
