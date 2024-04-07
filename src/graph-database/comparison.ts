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
  for (const key in a) if (!deepEqualSubset(a[key], b[key])) return false
  return true
}

// export const deepEqualSubset = (a: any, b: any) => {
//   if (a === b) return true;
//   if (Array.isArray(a) && Array.isArray(b)) {
//     if (a.length !== b.length) return false;
//     for (let i = 0; i < a.length; i++) {
//       if (!deepEqualSubset(a[i], b[i])) return false;
//     }
//     return true;
//   }
//   if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
//   const keysA = Object.keys(a);
//   for (const key of keysA) {
//     if (!(key in b) || !deepEqualSubset(a[key], b[key])) return false;
//   }
//   return true;
// };
