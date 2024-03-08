import { Observable, Subject, combineLatest, firstValueFrom, map, mergeMap, scan, shareReplay, startWith, switchMap } from 'rxjs'

import { merge } from './utils/merge'

const recursiveRemoveNullable = (obj) =>
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

// type Node<NodeType extends { __typename: string } & { [key in IdKey]: string } & { [key: string]: any }, IdKey extends string = 'id'> =
//   { [key in IdKey]: string } &
//   {
//     __typename: NodeType['__typename']
//   } & NodeType
//   & { [key: string]: any }

type NodeData =
  { __typename: string } &
  { [key: string]: any }

type Node<NodeDataType extends NodeData> = {
  id: string
  $: Observable<NodeDataType>
  set: (changes: Partial<NodeDataType>) => Promise<void>
  get: () => Promise<NodeDataType>
  map: <T>(fn: (node: NodeDataType) => T) => Observable<T>
}

type KeyGenerator = (data: any) => string | null

type KeyingConfig = {
  [typename: string]: KeyGenerator
}

export const makeGraph = <NodeType extends NodeData>(
  { keys }:
  { keys: KeyingConfig }
) => {
  const nodesMap = new Map<string, Node<NodeType>>()
  
  const makeNode = <T extends NodeType>(_node: T) => {
    const id = keys[_node.__typename]?.(_node) as string

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
      map: <T2 extends (node: T) => ReplaceNodeType<T, Node<T>>>(fn: T2): ReplaceObservableType<T, Observable<any>> =>
        nodeObservable
          .pipe(
            switchMap(node => {
              const result = fn(node)
              const observables = getObservables(result)
              const allObservablesResults = combineLatest(observables)
              return (
                allObservablesResults
                  .pipe(
                    map(results =>
                      replaceObservablePairs(
                        result,
                        results.map((result, i) => [observables[i], result] as const)
                      )
                    )
                  )
              )
            })
          )
    } as Node<T>
    nodesMap.set(id, node)
    return node
  }

  return {
    makeNode
  }
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

type ReplaceNodeType<Value, Target extends Node<any>> =
  Value extends Node<infer T> ? T :
  Value extends Array<infer T> ? ReplaceNodeType<T, Target>[] :
  Value extends object ? { [key in keyof Value]: ReplaceNodeType<Value[key], Target> } :
  Value

type ReplaceObservableType<Value, Target extends Observable<any>> =
  Value extends Observable<infer T> ? T :
  Value extends Array<infer T> ? ReplaceObservableType<T, Target>[] :
  Value extends object ? { [key in keyof Value]: ReplaceObservableType<Value[key], Target> } :
  Value

export const replaceObservablePairs = <T>(value: T, replacementPairs: [Observable<any>, any][]): ReplaceObservableType<T, Observable<any>> =>
  Array.isArray(value) ? value.map(v => replaceObservablePairs(v, replacementPairs)) :
  value instanceof Observable ? replacementPairs.find(([observable]) => observable === value)?.[1] :
  value && typeof value === 'object' ? Object.fromEntries(
    Object
      .entries(value)
      .map(([key, value]) => [
        key,
        replaceObservablePairs(value, replacementPairs)
      ])
  ) :
  value


type User = {
  __typename: 'User'
  uri: string
  foo: string
  friends: Node<User>[]
}

type Nodes = User

const graph = makeGraph<Nodes>({
  keys: {
    User: user => user.uri
  }
})

const user1 = graph.makeNode({
  __typename: 'User',
  uri: 'user1',
  foo: 'foo1',
  friends: []
} as User)

const user2 = graph.makeNode({
  __typename: 'User',
  uri: 'user2',
  foo: 'foo2',
  friends: [user1]
})

user1.set({ friends: [user2] })

const userWithFriends =
  user1
    .$
    .pipe(
      switchMap(user =>
        combineLatest(
          user
            .friends
            .map(friend => friend.$)
        ).pipe(
          map(friends => ({
            ...user,
            friends
          }))
        )
      )
    )

userWithFriends.subscribe(res => {
  console.log('userWithFriends', res)
})

const userWithFriendsMap =
  user1
    .map(user => ({
      ...user,
      friends: user.friends.map(friend => friend.$)
    }))

userWithFriendsMap.subscribe(res => {
  console.log('userWithFriends 2222', res)
})

// const friendsFoos =
//   user1
//     .$
//     .pipe(
//       map(user => user.friends),
//       switchMap(friends =>
//         combineLatest(
//           friends
//             .map(friend =>
//               friend
//                 .$
//                 .pipe(
//                   map(friend => friend.foo)
//                 )
//             )
//         )
//       )
//     )
