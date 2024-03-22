import { toPathEntry } from './path'

type FieldsUpdateOperators = {
  /** Sets the value of a field to current date, either as a Date or a Timestamp. */
  $currentDate?: Date
  /** Increments the value of the field by the specified amount. */
  $inc?: number
  /** Only updates the field if the specified value is less than the existing field value. */
  $min?: any
  /** Only updates the field if the specified value is greater than the existing field value. */
  $max?: any
  /** Multiplies the value of the field by the specified amount. */
  $mul?: number
  /** Renames a field. */
  $rename?: string
  /** Sets the value of a field in a document. */
  $set?: any
  /** Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents. */
  $setOnInsert?: any
  /** Removes the specified field from a document. */
  $unset?: boolean
}

type FieldsUpdateOperator = keyof FieldsUpdateOperators

type ArrayUpdateOperators = {
  // $?: any
  // '$[]'?: any
  // '$[<identifier>]'?: any
  /** Adds an element to an array. */
  $push?: any
  /** Adds each element in an array to an array. */
  $pushAll?: any[]
  /** Adds multiple elements to an array. */
  $addToSet?: any
  /** Removes the first or last item of an array. */
  $pop?: 1 | -1
  /** Removes all occurrences of a value from an array. */
  $pull?: any
  /** Removes multiple values from an array. */
  $pullAll?: any[]
  

  // $each?: any[]
  // $position?: number
  // $slice?: number
  // $sort?: number
}

type ArrayUpdateOperator = keyof ArrayUpdateOperators

type UpdateOperators = FieldsUpdateOperators & ArrayUpdateOperators

type UpdateOperator = FieldsUpdateOperator & ArrayUpdateOperator

type UpdateOperatorValue = UpdateOperators[UpdateOperator]

const fieldsUpdateOperators = [
  '$currentDate',
  '$inc',
  '$min',
  '$max',
  '$mul',
  '$rename',
  '$set',
  '$setOnInsert',
  '$unset'
] as FieldsUpdateOperator[]

const arrayUpdateOperators = [
  // '$',
  // '$[]',
  // '$[<identifier>]',
  '$push',
  '$pushAll',
  '$addToSet',
  '$pop',
  '$pull',
  '$pullAll'
] as ArrayUpdateOperator[]

export const update = (document: any, update: UpdateOperators): any => ({
  ...document,
  ...Object
      .entries(update)
      .reduce((acc, [operatorType, operatorValue]) => ({
        ...acc,
        ...fieldsUpdateOperators.includes(operatorType as FieldsUpdateOperator) ? updateField(operatorType as FieldsUpdateOperator, document, operatorType)
        : arrayUpdateOperators.includes(operatorType as ArrayUpdateOperator) ? updateArray(operatorType as ArrayUpdateOperator, document, operatorType)
        : { [operatorType]: updateDocument(document[operatorType], operatorValue) }
      }), document)
})

const updateDocument = (target: any, update: UpdateOperators): any =>
  typeof update === 'object'
    ? updateObject(target, update)
    : update

const updateObject = (target: any, update: UpdateOperators): any => ({
  ...target,
  ...Object.fromEntries(
    Object
      .entries(update)
      .map(([key, value]) => [
        key,
        fieldsUpdateOperators.includes(key as FieldsUpdateOperator) ? updateField(key as FieldsUpdateOperator, target, key)
        : arrayUpdateOperators.includes(key as ArrayUpdateOperator) ? updateArray(key as ArrayUpdateOperator, target, key)
        : updateDocument(target[key], value)
      ])
  )
})

const updateCurrentDate = <T extends string, T2 extends Record<T, Date>>(target: T2, key: T) => ({
  ...target,
  [key]: new Date()
})

const updateIncrement = <T extends string, T2 extends Record<T, number>>(target: T2, key: T): any => ({
  ...target,
  [key]: target[key] + 1
})

const updateMinimum = <T extends string, T2 extends Record<T, number>>(target: T2, key: T, value: number) => ({
  ...target,
  [key]: Math.min(target[key], value)
})

const updateMaximum = (target: any, key: string, value: number) => ({
  ...target,
  [key]: Math.max(target[key], value)
}) 

const updateMultiply = <T extends string, T2 extends Record<T, number>>(target: T2, key: T, value: number) => ({
  ...target,
  [key]: target[key] * value
})

const updateRename = (target: any, key: string, value: string): any => {
  const { [key]: _, ...rest } = target
  return {
    ...rest,
    [value]: target[key]
  }
}

const updateSet = (target: any, key: string) => ({
  ...target,
  [key]: key
})

const updateSetOnInsert = (target: any, key: string) => ({
  ...target,
  [key]: key
})

const updateUnset = (target: any, key: string) => {
  const { [key]: _, ...rest } = target
  return rest
}

const updatePush = (target: any, key: string, value: any) => ({
  ...target,
  [key]: [...target[key], value]
})

const updatePushAll = (target: any, key: string, values: any[]) => ({
  ...target,
  [key]: [...target[key], ...values]
})

const updateAddToSet = (target: any, key: string, value: any) => ({
  ...target,
  [key]: [...new Set([...target[key], value])]
})

const updatePop = (target: any, key: string) => ({
  ...target,
  [key]: target[key].slice(0, -1)
})

const updatePull = (target: any, key: string) => ({
  ...target,
  [key]: target.filter((item: any) => item !== key)
})

const updatePullAll = (target: any, key: string) => ({
  ...target,
  [key]: target.filter((item: any) => !key.includes(item))
})

const updateField = (operator: FieldsUpdateOperator, value: UpdateOperatorValue, path: string): any => {
  if (operator === '$currentDate') return updateCurrentDate(target, key)
  if (operator === '$inc') return updateIncrement(target, key)
  if (operator === '$min') return updateMinimum(target, key)
  if (operator === '$max') return updateMaximum(target, key)
  if (operator === '$mul') return updateMultiply(target, key)
  if (operator === '$rename') return updateRename(target, key)
  if (operator === '$set') return updateSet(target, key)
  if (operator === '$setOnInsert') return updateSetOnInsert(target, key)
  if (operator === '$unset') return updateUnset(target, key)
}

const updateArray = (operator: ArrayUpdateOperator, path: string): any => {
  if (operator === '$push') return updatePush(target, key)
  if (operator === '$pushAll') return updatePushAll(target, key)
  if (operator === '$addToSet') return updateAddToSet(target, key)
  if (operator === '$pop') return updatePop(target, key)
  if (operator === '$pull') return updatePull(target, key)
  if (operator === '$pullAll') return updatePullAll(target, key)
}
