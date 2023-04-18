export const mergeDeep = (...values: any[]) =>
  values.reduce((acc, value) => {
    // if (Array.isArray(value)) {
    //   console.log('DEEP MERGE IS ARRAY', values, acc, value)
    // }
    if (Array.isArray(value)) {
      return [...Array.isArray(acc) ? acc : [], ...value]
    }
    if (typeof acc === 'object' && typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = mergeDeep(acc[key], value[key])
        return acc
      }, { ...acc })
    }
    return value
  }, {})
