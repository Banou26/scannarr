import { Observable, Subject, combineLatest, firstValueFrom, map, mergeMap, of, scan, shareReplay, startWith, switchMap } from 'rxjs'

import { merge } from '../utils'

export const recursiveRemoveNullable = (obj) =>
  Array.isArray(obj)
    ? obj.map(recursiveRemoveNullable)
    : (
      typeof obj === 'object'
        ? (
          Object
            .fromEntries(
              Object
                .entries(obj)
                .filter(([_, value]) => value !== null && value !== undefined)
                .map(([key, value]) => [key, recursiveRemoveNullable(value)])
            )
        )
        : obj
    )

export type NodeData =
  { _id: string, __typename: string } &
  { [key: string]: any }

export type Node<NodeDataType extends NodeData> = {
  _id: string
  $: Observable<NodeDataType>
  subject: Subject<NodeDataType>
  data: NodeDataType
  update: (changes: Partial<NodeDataType>) => Promise<void>
  get: () => Promise<NodeDataType>
  map: <T2 extends (nodeData: NodeDataType, node: Node<NodeDataType>) => any>(fn: T2) => ReturnType<T2> extends Observable<infer U> ? Observable<U> : ReturnType<T2>
}

type ExtractObservableType<T> =
  T extends Observable<infer U> ? U :
  T extends Array<infer U> ? ExtractObservableType<U>[] :
  T extends object ? { [key in keyof T]: ExtractObservableType<T[key]> }[keyof T] :
  never

export const getObservables = <T>(value: T): ExtractObservableType<T> => {
  const observables: Observable<T>[] = []
  const recurse = (value: any) =>
    value instanceof Observable ? observables.push(value) :
    Array.isArray(value) ? value.map(recurse) :
    value && typeof value === 'object' ? Object.values(value).map(recurse) :
    undefined

  recurse(value)
  return observables as ExtractObservableType<T>
}

type UnwrapObservables<Value> =
  Value extends Observable<infer T> ? UnwrapObservables<T> :
  Value extends Array<infer T> ? UnwrapObservables<T>[] :
  Value extends Object ? { [key in keyof Value]: UnwrapObservables<Value[key]> } :
  Value

export const replaceObservablePairs = <T>(value: T, replacementPairs: [Observable<any>, any][]): UnwrapObservables<T> =>
  Array.isArray(value) ? value.map(v => replaceObservablePairs(v, replacementPairs)) :
  value instanceof Observable ? replacementPairs.find(([observable]) => observable === value)?.[1] :
  value && typeof value === 'object' && !('__type__' in value) && value['__type__'] !== 'Node' ? Object.fromEntries(
    Object
      .entries(value)
      .map(([key, value]) => [
        key,
        replaceObservablePairs(value, replacementPairs)
      ])
  ) :
  value

const deepEqual = (a: any, b: any) => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (Object.keys(a).length !== Object.keys(b).length) return false
  for (const key in a) if (!deepEqual(a[key], b[key])) return false
  return true
}

type Indexer<NodeType extends NodeData> = {
  findOne: ({ filter, filteredNodes }: { filter: Partial<NodeType>, filteredNodes: Node<NodeType>[] }) => Node<NodeType> | undefined
  insertOne: (node: Node<NodeType>) => void
}

const uidIndexer = <NodeType extends NodeData>(): Indexer<NodeType> => {
  const nodesMap = new Map<string, Node<NodeType>>()
  return {
    findOne: ({ filter }) => filter._id ? nodesMap.get(filter._id) : undefined,
    insertOne: (node) => nodesMap.set(node._id, node)
  }
}

const deepEqualIndexer = <NodeType extends NodeData>(): Indexer<NodeType> => {
  let nodes: Node<NodeType>[] = []
  return {
    findOne: ({ filter, filteredNodes }) =>
      filteredNodes
        .find(_node => deepEqual(filter, _node.data)),
    insertOne: (node) => {
      nodes = [...nodes, node]
    }
  }
}

export const makeInMemoryGraphDatabase = <NodeType extends NodeData>(
  { indexers: _indexers }:
  { indexers?: Indexer<NodeType>[] }
) => {
  const indexers = [
    uidIndexer<NodeType>(),
    ..._indexers ?? [],
    deepEqualIndexer<NodeType>()
  ]
  const nodes = new Map<string, Node<NodeType>>()

  const findNodeOne = (filter: Partial<NodeType>) =>
    indexers
      .reduce(
        (filteredNodes, indexer) => {
          const indexResult = indexer.findOne({ filteredNodes, filter })
          return (
            indexResult
              ? [indexResult]
              : filteredNodes
          )
        },
        [...nodes.values()]
      )
      .at(0)

  const mapNode = <T extends NodeType, T2 extends (nodeData: NodeType, node: Node<NodeType>) => any>(node: Node<T>, fn: T2) =>
    node
      .$
      .pipe(
        switchMap(data => {
          const result = fn(data, node)
          const observables = getObservables(result)
          if (!observables.length) return of(result)
          return (
            combineLatest(observables as Observable<any>)
              .pipe(
                map(results =>
                  replaceObservablePairs(
                    result,
                    results.map((result, i) => [
                      (observables as Observable<any>[])[i]!,
                      result
                    ])
                  )
                )
              )
          )
        })
      )

  return {
    mapNode,
    findOne: <T extends NodeType>(filter: Partial<T>) => findNodeOne(filter)?.data,
    mapOne: <T2 extends (nodeData: NodeType, node: Node<NodeType>) => any>(filter: Partial<NodeType>, fn: T2) => {
      const foundNode = findNodeOne(filter)
      if (!foundNode) throw new Error(`No node found for ${JSON.stringify(filter)}`)
      return mapNode(foundNode, fn)
    },
    insertOne: <T extends Omit<NodeType, '_id'>, T2 extends boolean>(_node: T, { returnNode }: { returnNode?: T2 } = {}): T2 extends true ? Node<T & { _id: string }> : T & { _id: string } => {
      const _id = globalThis.crypto.randomUUID() as string
      const data = { ..._node, _id }

      const changesObservable = new Subject<T>()
      const nodeObservable =
        changesObservable
          .pipe(
            startWith(data),
            shareReplay(1)
          )
  
      if (!_id) throw new Error(`No key for ${_node.__typename}`)
  
      const node = {
        __graph_type__: 'Node',
        _id,
        subject: changesObservable,
        $: nodeObservable,
        data,
        update: (changes: Partial<T>) =>
          firstValueFrom(nodeObservable)
            .then(node =>
              changesObservable.next(
                merge(node, changes) as T
              )
            ),
        get: () => firstValueFrom(nodeObservable),
        map: <T2 extends (nodeData: NodeType, node: Node<NodeType>) => any>(fn: T2) => mapNode(node as Node<NodeType>, fn)
      }

      nodes.set(_id, node as Node<T>)
      for (const indexer of indexers) indexer.insertOne(node)

      return (
        returnNode
          ? node as Node<T & { _id: string }>
          : data as T & { _id: string }
      )
    },
    updateOne: <T extends NodeType>(filter: Partial<T>, changes: Partial<T>) => {
      const node = findNodeOne(filter)
      if (!node) throw new Error(`No node found for ${JSON.stringify(filter)}`)
      firstValueFrom(node.$)
        .then(nodeData => {
          const newData = merge(nodeData, changes) as T
          node.data = newData
          node.subject.next(newData)
        })
    }
  }
}

export type InMemoryGraphDatabase = ReturnType<typeof makeInMemoryGraphDatabase>
