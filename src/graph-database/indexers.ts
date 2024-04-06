import type { InternalNode, NodeData } from './index'
import { pathToKey, pathToTarget, pathToValue, toPathEntry } from './path'
import { QuerySelectors } from './query'

type Indexer = {
  __graph_type__: 'Indexer'
  __propertyPath__?: string
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
      const key = pathToKey(propertyPath)
      const value = pathToTarget(filter, propertyPath)
      return value && key in value
    },
    find: (filter) => {
      const value = pathToValue(filter, propertyPath)
      return nodesMap.get(value) ?? []
    },
    findOne: (filter) => {
      const value = pathToValue(filter, propertyPath)
      return nodesMap.get(value)?.[0]
    },
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

      console.log('insertOne', value?.[key], node.data, propertyPath)

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

      nodesMap.set(
        value,
        (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
      )
      nodesMap.set(
        newValue,
        [
          ...nodesMap.get(newValue) ?? [],
          node
        ]
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
