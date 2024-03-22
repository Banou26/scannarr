import type { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource, Team, UserMedia } from '../generated/graphql'

import { Observable, Subject, combineLatest, map, of, shareReplay, startWith, switchMap } from 'rxjs'

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
  Media | Episode | UserMedia | PlaybackSource |
  Team | MediaExternalLink | MediaTrailer

export type Node<NodeDataType extends NodeData> = {
  __graph_type__: 'Node'
  _id: string
  $: Observable<NodeDataType>
  subject: Subject<NodeDataType>
  data: NodeDataType
}

type ExtractObservableType<T> =
  T extends Observable<infer U> ? U :
  T extends Array<infer U> ? ExtractObservableType<U>[] :
  T extends object ? { [key in keyof T]: ExtractObservableType<T[key]> }[keyof T] :
  never

export const getObservables = <T>(value: T): ExtractObservableType<T> => {
  const objects = new Set()
  const observables: Observable<T>[] = []

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
  value && typeof value === 'object' && !('__graph_type__' in value) && value['__graph_type__'] !== 'Node' ? Object.fromEntries(
    Object
      .entries(value)
      .map(([key, value]) => [
        key,
        replaceObservablePairs(value, replacementPairs)
      ])
  ) :
  value

type ExtractNodeType<T> =
  T extends Node<infer U> ? U :
  T extends Array<infer U> ? ExtractNodeType<U>[] :
  T extends object ? { [key in keyof T]: ExtractNodeType<T[key]> }[keyof T] :
  never

// export const getNodes = <T extends NodeData>(value: Node<T>): ExtractNodeType<T> => {
//   const objects = new Set()
//   const nodes: Node<T>[] = []

//   const recurse = (value: any) => {
//     if ('__graph_type__' in value && value.__graph_type__ === 'Node') {
//       nodes.push(value)
//       return
//     }
//     if (Array.isArray(value)) return value.map(recurse)
//     if (value && typeof value === 'object') {
//       if (objects.has(value)) return
//       objects.add(value)
//       Object.values(value).map(recurse)
//     }
//   }

//   recurse(value)
//   return nodes as ExtractNodeType<T>
// }

// const replaceNodePairs = <T extends NodeData>(value: Node<T>, replacementPairs: [Node<any>, any][]): ExtractNodeType<T> =>
//   Array.isArray(value) ? value.map(v => replaceNodePairs(v, replacementPairs)) :
//   '__graph_type__' in value && value.__graph_type__ === 'Node' ? replacementPairs.find(([node]) => node === value)?.[1] :
//   value && typeof value === 'object' && !('__graph_type__' in value) && value['__graph_type__'] !== 'Node' ? Object.fromEntries(
//     Object
//       .entries(value)
//       .map(([key, value]) => [
//         key,
//         replaceNodePairs(value, replacementPairs)
//       ])
//   ) :
//   value

type ExtractAllTypes<T> =
  T extends Array<infer U> ? ExtractAllTypes<U>[] :
  T extends object ? T | { [key in keyof T]: ExtractAllTypes<T[key]> }[keyof T] :
  T

type ScannarrTypes = Extract<NonNullable<ExtractAllTypes<NodeData>>, object>

const isNode = (value: any): value is Node<NodeData> =>
  value && typeof value === 'object' &&
  '__graph_type__' in value && value.__graph_type__ === 'Node'

const isNodeData = (value: ScannarrTypes): value is NodeData =>
  value && typeof value === 'object' &&
  '__typename' in value && '_id' in value

const replaceNodeToData = (value: Node<NodeData>) => {
  const refMap = new Map<Node<NodeData>, NodeData>()

  const recurse = (value: Node<NodeData> | ScannarrTypes) => {
    if (Array.isArray(value)) return value.map(val => recurse(val))
    if (isNode(value)) {
      if (refMap.has(value)) return refMap.get(value)
      const newNodeDataRef = {} as NodeData
      refMap.set(value, newNodeDataRef)
      Object.assign(newNodeDataRef, recurse(value.data))
      return newNodeDataRef
    }
    if (value && typeof value === 'object') {
      return (
        Object.fromEntries(
          Object
            .entries(value)
            .map(([key, value]) => [key, recurse(value)])
        )
      )
    }
    return value
  }
  
  return recurse(value)
}

export const makeInMemoryGraphDatabase = () => {
  const nodes = new Map<string, Node<NodeData>>()

  const find = (filter: (value: NodeData, node: Node<NodeData>) => boolean) =>
    [...nodes.values()]
      .filter(node => filter(node.data, node))

  const findOne = (filter: (value: NodeData, node: Node<NodeData>) => boolean) =>
    [...nodes.values()]
      .find(node => filter(node.data, node))

  const mapNode = <T extends (nodeData: NodeData, node: Node<NodeData>) => NodeData>(node: Node<NodeData>, fn: T) =>
    node
      .$
      .pipe(
        switchMap(data => {
          const result = fn(data, node)
          const observables = getObservables(result)
          if (!observables?.length) return of(result)
          return (
            combineLatest(observables)
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
    nodes,
    mapNode,
    findOne: (filter: (value: NodeData, node: Node<NodeData>) => boolean) => findOne(filter)?.data,
    find: (filter: (value: NodeData, node: Node<NodeData>) => boolean) => find(filter).map(node => node.data),
    mapOne: <T extends (nodeData: NodeData, node: Node<NodeData>) => NodeData>(filter: (value: NodeData, node: Node<NodeData>) => boolean, fn: T) => {
      const foundNode = findOne(filter)
      if (!foundNode) throw new Error(`No node found for ${JSON.stringify(filter)}`)
      return mapNode(foundNode, fn)
    },
    insertOne: <T extends Omit<NodeData, '_id'>>(_node: T) => {
      const _id = globalThis.crypto.randomUUID() as string
      const data = { ..._node, _id }

      const changesObservable = new Subject<NodeData>()
      const nodeObservable =
        changesObservable
          .pipe(
            startWith(data),
            shareReplay(1)
          )
  
      if (!_id) throw new Error(`No key for ${_node.__typename}`)
  
      const node = {
        __graph_type__: 'Node' as const,
        _id,
        subject: changesObservable,
        $: nodeObservable,
        data
      } as Node<NodeData>

      nodes.set(_id, node)

      return data
    },
    updateOne: (
      filter: (value: NodeData, node: Node<NodeData>) => boolean,
      updateFunction: (value: NodeData, node: Node<NodeData>) => NodeData
    ) => {
      const node = findOne(filter)
      if (!node) {
        console.log('No node found for', filter)
        return
      }
      const newData = updateFunction(node.data, node)
      node.data = newData
      node.subject.next(newData)
    }
  }
}

export type InMemoryGraphDatabase = ReturnType<typeof makeInMemoryGraphDatabase>
