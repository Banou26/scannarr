import { Observable, Subject, combineLatest, firstValueFrom, map, mergeMap, scan, shareReplay, switchMap } from 'rxjs'

import { merge } from '../utils'

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
    const changesObservable = new Subject<T>()
    const nodeObservable =
      changesObservable
        .pipe(
          shareReplay(1)
        )
      
    const id = keys[_node.__typename]?.(_node) as string
    if (!id) throw new Error(`No key for ${_node.__typename}`)

    const node = {
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
      map: <T2 extends (node: T) => Observable<T2 | T2[]> | T2 | T2[]>(fn: T2) =>
        nodeObservable
          .pipe(
            switchMap(node => {
              const result = fn(node)

              if (Array.isArray(result)) {
                return combineLatest(result)
              }

              return (
                result instanceof Observable
                  ? result
                  : new Observable<T>(subscriber => {
                    subscriber.next(result)
                    subscriber.complete()
                  })
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

const friendsFoos =
  user1
    .$
    .pipe(
      map(user => user.friends),
      switchMap(friends =>
        combineLatest(
          friends
            .map(friend =>
              friend
                .$
                .pipe(
                  map(friend => friend.foo)
                )
            )
        )
      )
    )

// const friendsFoos =
//   user1
//     .map(user =>
//       user
//         .friends
//         .map(friend =>
//           friend.map(friend => friend.foo)
//         )
//     )
