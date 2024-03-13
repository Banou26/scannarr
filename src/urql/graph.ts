import { Observable, Subject, combineLatest, firstValueFrom, map, mergeMap, of, scan, shareReplay, startWith, switchMap } from 'rxjs'

import { merge } from '../utils'
import { Episode, Media, MediaExternalLink, MediaTrailer, PlaybackSource, Team } from '../generated/graphql'

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

type NodeData =
  { __typename: string } &
  { [key: string]: any }

type Node<NodeDataType extends NodeData> = {
  id: string
  $: Observable<NodeDataType>
  set: (changes: Partial<NodeDataType>) => Promise<void>
  get: () => Promise<NodeDataType>
  map: <T>(fn: (node: NodeDataType) => T) => Observable<UnwrapObservables<T>>
}

type KeyGenerator = (data: any) => string | null

type KeyingConfig = {
  [typename: string]: KeyGenerator
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

// todo: add custom merge function
export const makeGraph = <NodeType extends NodeData>(
  { keys }:
  { keys: KeyingConfig }
) => {
  const nodesMap = new Map<string, Node<NodeType>>()
  console.log('nodesMap', nodesMap)
  
  const makeNode = <T extends NodeType>(_node: T) => {
    const id = `${_node.__typename}:${keys[_node.__typename]?.(_node) as string}`

    if (nodesMap.has(id)) {
      throw new Error(`Node with id "${id}" already exists`)
    }

    const changesObservable = new Subject<T>()
    const nodeObservable =
      changesObservable
        .pipe(
          startWith(_node),
          shareReplay(1)
        )

    if (!id) throw new Error(`No key for ${_node.__typename}`)

    const node = {
      __type__: 'Node',
      id,
      $: nodeObservable,
      set: (changes: Partial<T>) =>
        firstValueFrom(nodeObservable)
          .then(node =>
            changesObservable.next(
              merge(node, changes) as T
            )
          ),
      get: () => firstValueFrom(nodeObservable),
      map: <T2 extends (node: T) => any>(fn: T2) =>
        nodeObservable
          .pipe(
            switchMap(node => {
              const result = fn(node)
              const observables = getObservables(result)
              if (!observables.length) return of(result)
              const allObservablesResults = combineLatest(observables as Observable<any>)
              return (
                allObservablesResults
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
    } as Node<T>
    nodesMap.set(id, node as Node<NodeType>)
    return node
  }

  return {
    makeNode,
    hasNode: (id: string) => nodesMap.has(id),
    getNode: (id: string) => nodesMap.get(id)
  }
}

export const keyResolvers = {
  UserMediaPage: () => null,
  Authentication: () => null,
  AuthenticationMethod: () => null,
  MediaPage: () => null,
  Media: (media) => (media as Media).uri,
  MediaConnection: () => null,
  MediaEdge: () => null,
  Episode: (episode) => (episode as Episode).uri,
  EpisodePage: () => null,
  EpisodeConnection: () => null,
  EpisodeEdge: () => null,
  PlaybackSourcePage: () => null,
  PlaybackSource: (playbackSource) => (playbackSource as PlaybackSource).uri,
  Team: (team) => (team as Team).uri,
  PlaybackSourceConnection: () => null,
  PlaybackSourceEdge: () => null,
  MediaExternalLink: (mediaExternalLink) => (mediaExternalLink as MediaExternalLink).uri,
  MediaTrailer: (mediaTrailer) => (mediaTrailer as MediaTrailer).uri,
  MediaCoverImage: () => null,
  MediaTitle: () => null,
  FuzzyDate: () => null,
}

export type Graph = ReturnType<typeof makeGraph>
