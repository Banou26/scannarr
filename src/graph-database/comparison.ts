export const deepEqual = (a: any, b: any) => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (Object.keys(a).length !== Object.keys(b).length) return false
  for (const key in a) if (!deepEqual(a[key], b[key])) return false
  return true
}

// one sided deepEqual, only checks if a is a subset of b
export const deepEqualSubset = (a: any, b: any) => {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) return a.every((a, i) => deepEqualSubset(a, b[i]))
  if (typeof a !== 'object' || typeof b !== 'object') return false
  for (const key in a) if (!deepEqual(a[key], b[key])) return false
  return true
}
