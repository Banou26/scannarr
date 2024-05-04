import { Media, ResolversParentTypes, Scalars } from '../generated/graphql'
import { groupBy } from '../utils'
import { deepEqual } from './comparison'

type Typename = Exclude<
  keyof ResolversParentTypes,
  keyof Scalars |
  'Query' |
  'Mutation' |
  'Subscription'
>

type AllTypenameObject = ResolversParentTypes[Typename]

type _TypenameObject = Extract<AllTypenameObject, { __typename?: string | undefined }>

type TypenameObject = _TypenameObject extends { __typename?: infer T } ? { __typename: T } & _TypenameObject : never

export type MergeExtra = {
  previousParent: TypenameObject
  parent: TypenameObject
  mergeMap: MergeMap
  recurse: (a: TypenameObject, b: TypenameObject) => [string, TypenameObject]
}

export type MergeMap = {
  // key is the typename
  [typename in Typename]?: {
    // key is property in the typename, returns true if the value has been updated
    [keyField in keyof ResolversParentTypes[typename]]?: {
      // compare if both values are equal
      compare: (
        previousValue: ResolversParentTypes[typename][keyField],
        newValue: ResolversParentTypes[typename][keyField],
        extra: MergeExtra
      ) => boolean
      // merge the values
      merge: (
        previousValue: ResolversParentTypes[typename][keyField],
        newValue: ResolversParentTypes[typename][keyField],
        extra: MergeExtra
      ) =>
        ResolversParentTypes[typename][keyField]
    }
  }
}

/**
 * Returns a new object with the values from b merged deeply
 * into a potentially using some custom merge included in the mergeMap and
 * returns both the result and if any values have changed
 */
export const merge = (a: TypenameObject, b: TypenameObject, mergeMap: MergeMap) => {
  const referenceMap = new Map<TypenameObject, TypenameObject>()
  let changed = false

  const recurse = (a: TypenameObject, b: TypenameObject) => {
    const reference = referenceMap.get(a)
    if (reference) return reference

    const correspondingMergeMap = mergeMap[a.__typename]
    const result = { ...a }

    referenceMap.set(a, result)

    Object.assign(
      result,
      Object
        .fromEntries(
          Object
            .entries(b)
            .map(([key, value]) => {
              const previousValue = a[key]
              if (value && typeof value === 'object') {
                if (correspondingMergeMap && key in correspondingMergeMap) {
                  if (correspondingMergeMap[key].compare(previousValue, value, { previousParent: a, parent: b, mergeMap, recurse })) return [key, value]
                  changed = true
                  return [key, correspondingMergeMap[key].merge(previousValue, value, { previousParent: a, parent: b, mergeMap, recurse })]
                }
                if (Array.isArray(value)) {
                  if (!previousValue) {
                    changed = true
                    return [key, value]
                  }
                  if (
                    value.every(newNode => previousValue.some(node => node._id === newNode._id)) &&
                    previousValue.every(node => value.some(newNode => newNode._id === node._id))
                  ) {
                    return [key, previousValue]
                  }
                  changed = true

                  const [unpairedValues, pairedValues] = value.reduce<[Media[], Media[]]>(
                    ([unpairedValues, pairedValues], newNode) => {
                      const existingNode = previousValue.find(node => node._id === newNode._id)
                      if (existingNode) {
                        pairedValues.push(recurse(existingNode, newNode))
                      } else {
                        unpairedValues.push(newNode)
                      }
                      return [unpairedValues, pairedValues]
                    },
                    [[], []]
                  )

                  return [
                    key,
                    [
                      ...pairedValues,
                      ...unpairedValues
                    ]
                  ]
                }
                return [key, recurse(value, value)]
              } else {
                if (correspondingMergeMap && key in correspondingMergeMap) {
                  if (correspondingMergeMap[key].compare(previousValue, value, { previousParent: a, parent: b, mergeMap, recurse })) return [key, value]
                  changed = true
                  return [key, correspondingMergeMap[key].merge(previousValue, value, { previousParent: a, parent: b, mergeMap, recurse })]
                }
                if (previousValue !== value) changed = true
                return [key, value]
              }
            })
        )
    )

    return result
  }
  const result = recurse(a, b)
  return { result: result, changed }
}

export const mergeMap = {
  Media: {
    _id: {
      compare: (previousValue, newValue) => previousValue === newValue,
      merge: (previousValue, newValue) => newValue ?? previousValue
    },
    handles: {
      compare: (previousValue, newValue) =>
        newValue.every(newNode => previousValue?.some(node => node._id === newNode._id)),
      merge: (previousValue, newValue, { previousParent, recurse }) => {
        const results = [
          ...previousValue?.filter(node => newValue.some(newNode => newNode._id !== node._id)) ?? [],
          ...newValue ?? []
        ].filter(handle =>
          previousParent.origin === 'scannarr' && handle.origin === 'scannarr'
            ? false
            : true
        ).filter(Boolean) as Media[]

        const groupByUri =
          groupBy(
            results,
            result => result.uri
          )

        return [...groupByUri.values()].map(nodes => nodes[0])
      }
    }
  }
} satisfies MergeMap
