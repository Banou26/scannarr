import { Observable, Subject, combineLatest, shareReplay, startWith } from 'rxjs'
import { makePropertyIndexer } from './indexers'
import { QuerySelectors, matches } from './query'
import { mapNode } from './map'
import { deepEqual } from './comparison'

export type NodeData =
  { _id: string, __typename: string } &
  { [key: string]: any }

export type InternalNode<T extends NodeData> = {
  __graph_type__: 'Node'
  _id: string
  subject: Subject<T>
  $: Observable<T>
  data: T
}

type MergeMap = {
  [key: string]: (a: any, b: any) => any
}

export const makeGraphDatabase = ({ mergeMap }: { mergeMap: MergeMap }) => {
  const nodes = new Map<string, InternalNode<NodeData>>()
  const indexers = [
    makePropertyIndexer('_id'),
    makePropertyIndexer('_typename'),
    makePropertyIndexer('uri'),
    makePropertyIndexer('origin'),
    makePropertyIndexer('handles.uri')
  ]

  const findPreResults = (filter: QuerySelectors) => {
    const usedIndexers = indexers.filter(indexer => indexer.shouldBeUsedOnFilter(filter))
    if (usedIndexers.length === 0) {
      console.log('slow query', filter)
      return [...nodes.values()]
    }

    if (new Set().intersection) {
      const results =
        usedIndexers
          .map(indexer => indexer.find(filter))
          .sort((a, b) => a.length - b.length)
          .map(nodes => new Set(nodes))

      return [
        ...new Set(
          results
            .slice(1)
            .reduce((acc, nodes) => acc.intersection(nodes), results[0])
        )
      ]
    }

    const indexerResults = usedIndexers.map(indexer => indexer.find(filter)).sort((a, b) => a.length - b.length)
    const intersectionSet = new Set(indexerResults[0])

    for (const index of indexerResults.slice(1)) {
      for (const node of index) {
        if (!intersectionSet.has(node)) intersectionSet.delete(node)
      }
    }

    return [...intersectionSet]
  }

  const find = (filter: QuerySelectors) => (findPreResults(filter) ?? []).filter(node => matches(filter, node.data))
  const findOne = (filter: QuerySelectors) => findPreResults(filter)?.find(node => matches(filter, node.data))

  const insertOne = (nodeData: NodeData): NodeData => {
    const _id = globalThis.crypto.randomUUID() as string
    const data = { ...nodeData, _id }

    const changesObservable = new Subject<NodeData>()
    const nodeObservable =
      changesObservable
        .pipe(
          startWith(data),
          shareReplay(1)
        )

    if (!_id) throw new Error(`No key for ${nodeData.__typename}`)

    const node = {
      __graph_type__: 'Node' as const,
      _id,
      subject: changesObservable,
      $: nodeObservable,
      data
    } as InternalNode<NodeData>

    nodes.set(_id, node)
    indexers
      .filter(indexer => indexer.shouldBeUsedOnNode(data))
      .forEach(indexer => indexer.insertOne(node))

    return data
  }

  const updateOne = (filter: QuerySelectors, updateFunc: (data: NodeData) => NodeData) => {
    const node = findOne(filter)
    if (!node) throw new Error(`updateOne node not found for filter ${JSON.stringify(filter)}`)
    const newNodeData = updateFunc(node.data)
    indexers
      .filter(indexer =>
        indexer.shouldBeUsedOnFilter(filter)
        || indexer.shouldBeUsedOnNode(newNodeData)
        || indexer.shouldBeUsedOnNode(node.data)
      )
      .forEach(indexer => indexer.updateOne(node, node.data, newNodeData))
    const isDeepEqual = deepEqual(node.data, newNodeData)
    Object.assign(node.data, newNodeData)
    if (!isDeepEqual) node.subject.next(node.data)
    return node.data
  }

  const mapOne = (filter: QuerySelectors, mapFunc: (nodeData: Node, node: InternalNode<NodeData>) => Node) => {
    const node = findOne(filter)
    if (!node) throw new Error(`mapOne node not found for filter ${JSON.stringify(filter)}`)
    return mapNode(node, mapFunc)
  }

  const mapMany = (filter: QuerySelectors, mapFunc: (nodeData: Node, node: InternalNode<NodeData>) => Node) => {
    const nodes = find(filter)
    if (!nodes.length) throw new Error(`mapMany nodes not found for filter ${JSON.stringify(filter)}`)
    return combineLatest(nodes.map(node => mapNode(node, mapFunc)))
  }

  const removeOne = (filter: QuerySelectors) => {
    const node = findOne(filter)
    if (!node) throw new Error(`removeOne node not found for filter ${JSON.stringify(filter)}`)
    nodes.delete(node._id)
    indexers
      .filter(indexer => indexer.shouldBeUsedOnFilter(filter) || indexer.shouldBeUsedOnNode(node.data))
      .forEach(indexer => indexer.removeOne(node))
  }

  return {
    nodes,
    indexers,
    find: (filter: QuerySelectors) => find(filter).map(node => node.data),
    findOne: (filter: QuerySelectors) => findOne(filter)?.data,
    insertOne,
    updateOne,
    mapOne,
    mapMany,
    removeOne
  }
}

export type GraphDatabase = ReturnType<typeof makeGraphDatabase>
