import { deepEqual, deepEqualSubset } from './comparison'
import { pathToKey, pathToTarget, pathToValue, toPathEntry, toPathValue } from './path'

type ComparisonQuerySelectors = {
  /** Matches values that are equal to a specified value. */
  $eq?: any
  /** Matches values that are are not equal to a specified value. */
  $ne?: any
  /** Matches values that are greater than a specified value. */
  $gt?: number
  /** Matches values that are greater than or equal to a specified value. */
  $gte?: number
  /** Matches values that are less than a specified value. */
  $lt?: number
  /** Matches values that are less than or equal to a specified value. */
  $lte?: number
  /** Matches any of the values specified in an array. */
  $in?: any[]
  /** Matches none of the values specified in an array. */
  $nin?: any[]
}

type ComparisonQuerySelector = keyof ComparisonQuerySelectors

const comparisonQuerySelectors = [
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin'
] as ComparisonQuerySelector[]

type LogicalQuerySelectors = {
  /** Joins query clauses with a logical AND returns all documents that match the conditions of both clauses. */
  $and?: QuerySelectors[]
  /** Joins query clauses with a logical OR returns all documents that match the conditions of either clause. */
  $or?: QuerySelectors[]
  /** Inverts the effect of a query expression and returns documents that do not match the query expression. */
  $not?: QuerySelectors
}

type LogicalQuerySelector = keyof LogicalQuerySelectors

const logicalQuerySelectors = [
  '$and',
  '$or',
  '$not'
] as LogicalQuerySelector[]

type ElementQuerySelectors = {
  /** Matches documents that have the specified field. */
  $exists?: boolean
  /** Selects documents if a field is of the specified type. */
  $type?: 'double' | 'string' | 'object' | 'array' | 'binData' | 'undefined' | 'objectId' | 'bool' | 'date' | 'null' | 'regex' | 'dbPointer' | 'javascript' | 'symbol' | 'javascriptWithScope' | 'int' | 'timestamp' | 'long' | 'decimal' | 'minKey' | 'maxKey'
}

type EvaluationQuerySelectors = {
  /** Matches documents that satisfy a JavaScript expression. */
  $regex?: RegExp | string
  /** Matches documents that satisfy a JavaScript expression. */
  $text?: { $search: string, $language?: string, $caseSensitive?: boolean, $diacriticSensitive?: boolean }
  /** Matches documents that satisfy a JavaScript expression. */
  $where?: string | Function
}

type ArrayQuerySelectors = {
  /** Matches arrays that contain all elements specified in the query. */
  $all?: any[]
  /** Matches arrays that contain at least one element specified in the query. */
  $elemMatch?: any
  /** Selects documents if element in the array field matches all the specified $elemMatch condition. */
  $size?: number
}

type ProjectionOperators = {
  /** Projects the first element in an array that matches the query condition. */
  $: number
  /** Limits the number of elements projected from an array. Supports skip and limit slices. */
  $elemMatch?: any
  /** Projects the first element in an array that matches the specified condition. */
  $meta?: any
  /** Projects the first element in an array that matches the specified condition. */
  $slice?: number | [number, number]
}

export type QuerySelectors = ComparisonQuerySelectors & LogicalQuerySelectors & ElementQuerySelectors & EvaluationQuerySelectors & ArrayQuerySelectors

export const matches = (query: QuerySelectors, doc: any): boolean =>
  Object
    .entries(query)
    .every(([key, value]) => {
      const target = pathToTarget(doc, key)
      const targetKey = pathToKey(key)
      if (key.startsWith('$')) {
        if (key in logicalQuerySelectors) {
          return matchesLogicalQuerySelectors(key as LogicalQuerySelector, value, target, targetKey)
        }
        if (key in comparisonQuerySelectors) {
          return matchesComparisonQuerySelectors(key as ComparisonQuerySelector, value, target, targetKey)
        }
      }
      const targetValue = pathToValue(doc, key)

      if (Array.isArray(targetValue) && Array.isArray(value)) {
        return value.some((value) => targetValue.includes(value))
      }

      if (Array.isArray(targetValue)) {
        return targetValue.some((targetValue) => targetValue === value)
      }

      return deepEqualSubset(target[targetKey], value)
    }
  )

const matchesComparisonQuerySelectors = (operator: ComparisonQuerySelector, operatorValue: any, target: any, targetKey: string): boolean => {
  if (operator === '$eq') return deepEqualSubset(target[targetKey], operatorValue)
  if (operator === '$ne') return !deepEqualSubset(target[targetKey], operatorValue)
  if (operator === '$gt') return operatorValue > target[targetKey]
  if (operator === '$gte') return operatorValue >= target[targetKey]
  if (operator === '$lt') return operatorValue < target[targetKey]
  if (operator === '$lte') return operatorValue <= target[targetKey]
  if (operator === '$in') return operatorValue.includes(target[targetKey])
  if (operator === '$nin') return !operatorValue.includes(target[targetKey])
  return false
}

const matchesLogicalQuerySelectors = (operator: LogicalQuerySelector, operatorValue: QuerySelectors[], target: any, targetKey: string): boolean => {
  if (operator === '$and') return operatorValue.every((query) => matches(query, target[targetKey]))
  if (operator === '$or') return operatorValue.some((query) => matches(query, target[targetKey]))
  if (operator === '$not') return !matches(target[targetKey], operatorValue)
  if (operator === '$nor') return !operatorValue.some((query) => matches(query, target[targetKey]))
  return false
}
