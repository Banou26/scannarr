export const toPathEntry = (doc: any, path: string) => {
  const keys = path.split('.')
  const key = keys.pop()!
  return {
    target: keys.reduce((doc, key) => doc[key], doc),
    key
  }
}

export const toPathValue = (doc: any, path: string) =>
  path
    .split('.')
    .reduce((doc, key) => doc[key], doc)

// export const pathPartsToTarget = (doc: any, pathParts: string[]) => {
//   const pathPart = pathParts.at(0)
//   if (!pathPart) return doc
//   if (Array.isArray(doc)) {
//     const isPathPartArrayIndex = !isNaN(Number(pathPart))
//     if (isPathPartArrayIndex) {
//       return doc[pathPart]
//     }
//     return doc.map(doc => pathPartsToTarget(doc, pathParts))
//   }
//   if (!doc[pathPart]) return
//   return pathPartsToTarget(doc[pathPart], pathParts.slice(1))
// }

export const pathPartsToTarget = (doc: any, pathParts: string[]) => {
  if (!doc || pathParts.length === 0) return doc;

  const pathPart = pathParts[0];
  const isPathPartArrayIndex = /^\d+$/.test(pathPart);

  if (Array.isArray(doc)) {
    if (isPathPartArrayIndex) {
      const index = parseInt(pathPart, 10);
      return pathPartsToTarget(doc[index], pathParts.slice(1));
    }
    return doc.map(doc => pathPartsToTarget(doc, pathParts));
  }

  const nextDoc = doc[pathPart];
  if (nextDoc === undefined) return undefined;

  return pathPartsToTarget(nextDoc, pathParts.slice(1));
};

export const pathToValue = (doc: any, pathParts: string[]) =>
  pathPartsToTarget(doc, pathParts)

export const pathToTarget = (doc: any, pathParts: string[]) =>
  pathPartsToTarget(doc, pathParts.slice(0, -1))

export const pathToKey = (path: string) =>
  path.split('.').pop()!
