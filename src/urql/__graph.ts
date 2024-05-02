import { Observable, Subject, combineLatest, firstValueFrom, map, mergeMap, of, scan, shareReplay, startWith, switchMap } from 'rxjs'
import { flatten, $timestamp, $unset } from 'mongo-dot-notation'

import { merge } from '../utils'
import { deepEqualSubset } from '../graph-database/comparison'

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
  __graph_type__: 'Node'
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
  const objects = new Set()
  const observables: Observable<T>[] = []
  // const recurse = (value: any) =>
  //   value instanceof Observable ? observables.push(value) :
  //   Array.isArray(value) ? value.map(recurse) :
  //   value && typeof value === 'object' ? Object.values(value).map(recurse) :
  //   undefined

  const recurse = (value: any) => {
    if (value instanceof Observable) {
      observables.push(value)
      return
    }
    if (Array.isArray(value)) return value.map(recurse)
    if (value && typeof value === 'object') {
      if (objects.has(value)) return
      objects.add(value)
      Object.values(value).map(recurse)
    }
  }

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

type Indexer<NodeType extends NodeData> = {
  find: ({ filter, filteredNodes }: { filter: Partial<NodeType>, filteredNodes: Node<NodeType>[] }) => Node<NodeType>[]
  findOne: ({ filter, filteredNodes }: { filter: Partial<NodeType>, filteredNodes: Node<NodeType>[] }) => Node<NodeType> | undefined
  insertOne: (node: Node<NodeType>) => void
}

export const makePropertyIndexer = <NodeType extends NodeData, Property extends keyof NodeType>(property: Property): Indexer<NodeType> => {
  const nodesMap = new Map<string, Node<NodeType>[]>()
  return {
    find: ({ filter }) => filter[property] ? nodesMap.get(filter[property]!) ?? [] : [],
    findOne: ({ filter }) => filter[property] ? nodesMap.get(filter[property]!)?.at(0) : undefined,
    insertOne: (node) => nodesMap.set(node.data[property], [...nodesMap.get(node.data[property]) ?? [], node])
  }
}

const deepEqualIndexer = <NodeType extends NodeData>(): Indexer<NodeType> => {
  let nodes: Node<NodeType>[] = []
  return {
    find: ({ filter, filteredNodes }) =>
      filteredNodes.length
        ? filteredNodes.filter(_node => deepEqualSubset(filter, _node.data))
        : nodes.filter(_node => deepEqualSubset(filter, _node.data)),
    findOne: ({ filter, filteredNodes }) =>
      filteredNodes.length
        ? filteredNodes.find(_node => deepEqualSubset(filter, _node.data))
        : nodes.find(_node => deepEqualSubset(filter, _node.data)),
    insertOne: (node) => {
      nodes = [...nodes, node]
    }
  }
}


const updateOperators = ['$set', '$unset', '$merge', '$push', '$pull'] as const
type UpdateOperators = typeof updateOperators[number]

type UpdateObject<T> = {
  $set?: Partial<T>
  $unset?: Partial<T>
  $merge?: Partial<T>
  $push?: { [key in keyof T]?: T[key] }
  $pull?: { [key in keyof T]?: T[key] }
}

function updateObject<T>(_obj: T, update: UpdateObject<T>) {
  const obj = merge(_obj, _obj) as T
  if (update.$set) {
      for (let key in update.$set) {
          // Using dot notation to handle nested objects
          const keys = key.split('.');
          let target = obj;
          for (let i = 0; i < keys.length - 1; i++) {
              if (!target[keys[i]]) target[keys[i]] = {};
              target = target[keys[i]];
          }
          target[keys[keys.length - 1]] = update.$set[key];
      }
  }

  if (update.$unset) {
      for (let key in update.$unset) {
          // Assuming the path exists
          const keys = key.split('.');
          let target = obj;
          for (let i = 0; i < keys.length - 1; i++) {
              target = target[keys[i]];
          }
          delete target[keys[keys.length - 1]];
      }
  }

  if (update.$push) {
      for (let key in update.$push) {
          // Assuming the path exists and is an array
          const keys = key.split('.');
          let target = obj;
          for (let i = 0; i < keys.length - 1; i++) {
              target = target[keys[i]];
          }
          target[keys[keys.length - 1]].push(update.$push[key]);
      }
  }

  if (update.$pull) {
      for (let key in update.$pull) {
          // Assuming the path exists and is an array
          const keys = key.split('.');
          let target = obj;
          for (let i = 0; i < keys.length - 1; i++) {
              target = target[keys[i]];
          }
          target[keys[keys.length - 1]] = target[keys[keys.length - 1]].filter(item => item !== update.$pull[key]);
      }
  }
  return obj
}

export const makeInMemoryGraphDatabase = <NodeType extends NodeData>(
  { indexers: _indexers }:
  { indexers?: Indexer<NodeType>[] }
) => {
  const indexers = [
    makePropertyIndexer<NodeType, '_id'>('_id'),
    makePropertyIndexer<NodeType, '_typename'>('_typename'),
    ..._indexers ?? [],
    deepEqualIndexer<NodeType>()
  ]
  const nodes = new Map<string, Node<NodeType>>()

  const find = (filter: Partial<NodeType>) => {
    const allNodes = [...nodes.values()]
    const filteredNodes =
      indexers
        .reduce(
          (filteredNodes, indexer) => {
            const indexResult = indexer.find({ filteredNodes, filter })
            return (
              indexResult
                ? [indexResult]
                : filteredNodes
            )
          },
          allNodes
        )

    if (allNodes === filteredNodes) return undefined
    return filteredNodes
  }

  const findNodeOne = (filter: Partial<NodeType>) => {
    const allNodes = [...nodes.values()]
    const filteredNodes =
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
          allNodes
        )

    if (allNodes === filteredNodes) return undefined
    return filteredNodes[0]
  }

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
    indexers,
    nodes,
    mapNode,
    findOne: <T extends NodeType, T2 extends boolean>(filter: Partial<T>, { returnNode }: { returnNode?: T2 } = {}): (T2 extends true ? Node<T & { _id: string }> : T & { _id: string }) | undefined => {
      const foundNode = findNodeOne(filter)
      if (!foundNode) return undefined
      return (
        returnNode
          ? foundNode as Node<T & { _id: string }>
          : foundNode.data as T & { _id: string }
      )
    },
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
        // update: (changes: Partial<T>) =>
        //   firstValueFrom(nodeObservable)
        //     .then(node =>
        //       changesObservable.next(
        //         merge(node, changes) as T
        //       )
        //     ),
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
      if (!node) {
        console.log('No node found for', filter)
        return // throw new Error(`No node found for ${JSON.stringify(filter)}`)
      }
      firstValueFrom(node.$)
        .then(nodeData => {
          const newData = updateObject(nodeData, flatten(changes?.$set)) as T
          node.data = newData
          node.subject.next(newData)
        })
    }
  }
}

export type InMemoryGraphDatabase = ReturnType<typeof makeInMemoryGraphDatabase>
