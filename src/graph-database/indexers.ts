import type { InternalNode, NodeData } from './index'
import { pathPartsToTarget, pathToKey, pathToTarget, pathToValue } from './path'
import { QuerySelectors } from './query'

type Indexer = {
  __graph_type__: 'Indexer'
  __propertyPath__?: string
  shouldBeUsedOnFilter: (filter: QuerySelectors) => boolean
  shouldBeUsedOnNode: (data: NodeData) => boolean
  get: (node: InternalNode<NodeData>) => string | string[] | undefined
  find: (filter: QuerySelectors) => InternalNode<NodeData>[]
  findOne: (filter: QuerySelectors) => InternalNode<NodeData> | undefined
  insertOne: (node: InternalNode<NodeData>) => void
  updateOne: (node: InternalNode<NodeData>, previousIndex: string | string[] | undefined, newData: NodeData) => void
  removeOne: (node: InternalNode<NodeData>) => void
}

export const makePropertyIndexer = (propertyPath: string): Indexer => {
  const pathParts = propertyPath.split('.')
  const key = pathParts.pop()!
  const nodesMap = new Map<string, InternalNode<NodeData>[]>()
  // if (propertyPath === 'handles.uri') {
  //   console.log('nodesMap handles.uri', nodesMap)
  // }
  return {
    __graph_type__: 'Indexer' as const,
    __propertyPath__: propertyPath,
    shouldBeUsedOnFilter: (filter) => propertyPath in filter,
    shouldBeUsedOnNode: (node) => {
      const value = pathPartsToTarget(node, pathParts)

      if (Array.isArray(value)) return true

      return value && key in value
    },
    find: (filter) => {
      if (Array.isArray(filter[propertyPath])) {
        return (
          filter[propertyPath].reduce((acc, value) => [
            ...acc,
            ...(nodesMap.get(value) ?? [])
          ], [] as InternalNode<NodeData>[])
        )
      }
      return nodesMap.get(filter[propertyPath]) ?? []
    },
    findOne: (filter) => {
      if (Array.isArray(filter[propertyPath])) {
        return filter[propertyPath].find(value => nodesMap.get(value))?.[0]
      }
      return nodesMap.get(filter[propertyPath])?.[0]
    },
    get: (node) => {
      const value = pathToValue(node.data, pathParts)

      if (Array.isArray(value)) {
        return value.map(value => value[key])
      }

      return value?.[key]
    },
    insertOne: (node) => {
      const value = pathPartsToTarget(node.data, pathParts)

      // if (node.data.__typename === 'Media' && propertyPath === 'handles.uri') {
      //   console.log('insertOne value', node.data, value)
      // }

      if (Array.isArray(value)) {
        value.forEach(value => {
          if (!value || !(key in value)) return
          nodesMap.set(
            value[key],
            [
              ...nodesMap.get(value[key]) ?? [],
              node
            ]
          )
        })
        return
      }

      if (!value || !(key in value)) return
      nodesMap.set(
        value[key],
        [
          ...nodesMap.get(value[key]) ?? [],
          node
        ]
      )
    },
    updateOne: (node, previousIndex, newData) => {
      const newValue = pathPartsToTarget(newData, pathParts)
      // if (node.data.__typename === 'Media' && propertyPath === 'handles.uri') {
      //   console.log('updateOne value', newData, newValue)
      // }

      if (Array.isArray(newValue)) {
        if (Array.isArray(previousIndex)) {
          previousIndex.forEach(value => {
            nodesMap.set(
              value,
              (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
            )
          })
        }
        newValue.forEach(value => {
          if (!value || !(key in value)) return
          nodesMap.set(
            value[key],
            [
              ...nodesMap.get(value[key]) ?? [],
              node
            ]
          )
        })
        return
      }

      if (previousIndex && !Array.isArray(previousIndex)) {
        nodesMap.set(
          previousIndex,
          (nodesMap.get(previousIndex) ?? []).filter(_node => _node._id !== node._id)
        )
      }
      if (newValue && key in newValue) {
        nodesMap.set(
          newValue[key],
          [
            ...nodesMap.get(newValue[key]) ?? [],
            node
          ]
        )
      }
    },
    removeOne: (node) => {
      const value = pathToValue(node.data, pathParts)

      // if (node.data.__typename === 'Media' && propertyPath === 'handles.uri') {
      //   console.log('removeOne value', node.data, value)
      // }

      if (Array.isArray(value)) {
        value.forEach(value => {
          if (!value || !(key in value)) return
          nodesMap.set(
            value[key],
            (nodesMap.get(value[key]) ?? []).filter(_node => _node._id !== node._id)
          )
        })
        return
      }

      if (!value || !(key in value)) return
      nodesMap.set(
        value,
        (nodesMap.get(value) ?? []).filter(_node => _node._id !== node._id)
      )
    }
  }
}
