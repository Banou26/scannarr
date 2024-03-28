import type { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource, Team, UserMedia } from '../generated/graphql'

import { Observable, Subject, combineLatest, map, of, shareReplay, startWith, switchMap } from 'rxjs'
import { merge } from '../utils'


export type NonUndefinable<T> = Exclude<T, undefined | null>

export type RemoveNullable<T> =
  T extends Array<infer U> ? RemoveNullable<NonUndefinable<U>>[] :
  T extends object ? { [key in keyof T]: RemoveNullable<NonUndefinable<T[key]>> } :
  NonUndefinable<T>

export const recursiveRemoveNullable = <T>(obj: T): RemoveNullable<T> => {
  const ref = new Set()

  // const recurse = (obj: any): any =>
  //   (Array.isArray(obj)
  //     ? obj.map(recursiveRemoveNullable)
  //     : (
  //       typeof obj === 'object'
  //         ? (
  //           Object
  //             .fromEntries(
  //               Object
  //                 .entries(obj)
  //                 .filter(([_, value]) => value !== null && value !== undefined)
  //                 .map(([key, value]) => [key, recursiveRemoveNullable(value)])
  //             )
  //         )
  //         : obj
  //     )) as RemoveNullable<T>

  const recurse = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(recurse)
    if (obj && typeof obj === 'object') {
      if (ref.has(obj)) return
      ref.add(obj)
      return Object.fromEntries(
        Object
          .entries(obj)
          .filter(([_, value]) => value !== null && value !== undefined)
          .map(([key, value]) => [key, recurse(value)])
      )
    }
    return obj
  }

  return recurse(obj)
}

export type Node =
  Media | Episode | UserMedia | PlaybackSource |
  Team | MediaExternalLink | MediaTrailer

export type InternalNode<NodeType extends Node> = {
  __graph_type__: 'Node'
  _id: string
  $: Observable<NodeType>
  subject: Subject<NodeType>
  data: NodeType
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

const isInternalNode = (value: any): value is InternalNode<Node> =>
  value && typeof value === 'object' &&
  '__graph_type__' in value && value.__graph_type__ === 'Node'

const isNode = (value: any): value is Node =>
  value && typeof value === 'object' &&
  '__typename' in value && '_id' in value

type ExtractNode<T> =
  T extends Node ? T :
  T extends Array<infer U> ? ExtractNode<U>[] :
  T extends object ? { [key in keyof T]: ExtractNode<T[key]> }[keyof T] :
  never

export const getNodes = <T>(value: T): ExtractNode<T>[] => {
  const objects = new Set()
  const nodes: ExtractNode<T>[] = []

  const recurse = (value: any) => {
    if (objects.has(value)) return
    if (isNode(value)) {
      nodes.push(value as ExtractNode<T>)
      objects.add(value)
      Object.values(value).map(recurse)
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
  return nodes as ExtractNode<T>[]
}

export const replaceNodePairs = <T extends Node>(value: Node, replacementPairs: [Node, any][]): ExtractNode<T> =>
  Array.isArray(value) ? value.map(v => replaceNodePairs(v, replacementPairs)) :
  isNode(value) ? replacementPairs.find(([node]) => node === value)?.[1] :
  value && typeof value === 'object' && !getNodes(value) ? Object.fromEntries(
    Object
      .entries(value)
      .map(([key, value]) => [
        key,
        replaceNodePairs(value, replacementPairs)
      ])
  ) :
  value

type ExtractAllTypes<T> =
  T extends Array<infer U> ? ExtractAllTypes<U>[] :
  T extends object ? T | { [key in keyof T]: ExtractAllTypes<T[key]> }[keyof T] :
  T

type ScannarrTypes = Extract<NonNullable<ExtractAllTypes<Node>>, object>

export const makeInMemoryGraphDatabase = () => {
  const nodes = new Map<string, InternalNode<Node>>()

  const find = (filter: (value: Node, node: InternalNode<Node>) => boolean) =>
    [...nodes.values()]
      .filter(node => filter(node.data, node))

  const findOne = (filter: (value: Node, node: InternalNode<Node>) => boolean) =>
    [...nodes.values()]
      .find(node => filter(node.data, node))

  const mapNode = <T extends (nodeData: Node, node: InternalNode<Node>) => Node>(node: InternalNode<Node>, fn: T) =>
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
    findNodeOne: <T extends InternalNode<Node>>(filter: (value: Node, node: InternalNode<Node>) => boolean) => {
      const foundNode =
        typeof filter === 'string'
          ? nodes.get(filter)
          : findOne(filter)

      return foundNode as (T & { _id: string }) | undefined
    },
    findOne: <T extends Node>(filter: (value: Node, node: InternalNode<Node>) => boolean) => {
      const foundNode =
        typeof filter === 'string'
          ? nodes.get(filter)
          : findOne(filter)

      return foundNode?.data as (T & { _id: string }) | undefined
    },
    findNode: <T extends InternalNode<Node>>(filter: (value: Node, node: InternalNode<Node>) => boolean) => find(filter) as (T & { _id: string })[],
    find: <T extends Node>(filter: (value: Node, node: InternalNode<Node>) => boolean) =>
      find(filter).map(node => node.data) as (T & { _id: string })[],
    mapOne: <T extends (nodeData: Node, node: InternalNode<Node>) => Node & { _id: string }>(filter: string | ((value: Node, node: InternalNode<Node>) => boolean), fn: T) => {
      const foundNode =
        typeof filter === 'string'
          ? nodes.get(filter)
          : findOne(filter)
      if (!foundNode) throw new Error(`No node found for ${JSON.stringify(filter)}`)
      return mapNode(foundNode, fn)
    },
    insertOne: <T extends Omit<Node, '_id'>>(_node: T) => {
      const _id = globalThis.crypto.randomUUID() as string
      const data = { ..._node, _id }

      const changesObservable = new Subject<Node>()
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
      } as InternalNode<Node>

      nodes.set(_id, node)

      return data
    },
    updateOne: (
      filter: string | ((value: Node, node: InternalNode<Node>) => boolean),
      updateFunction: (value: Node, node: InternalNode<Node>) => Node
    ) => {
      const node =
        typeof filter === 'string'
          ? nodes.get(filter)
          : findOne(filter)
      if (!node) {
        console.log('No node found for', filter)
        return
      }
      node.data = Object.assign(node.data, updateFunction(node.data, node))
      node.subject.next(node.data)
      return node.data
    }
  }
}

export type InMemoryGraphDatabase = ReturnType<typeof makeInMemoryGraphDatabase>
