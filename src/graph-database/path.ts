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

export const pathPartToTarget = (doc: any, pathParts: string[]) => {
  const pathPart = pathParts.at(0)
  if (!pathPart) return doc
  if (Array.isArray(doc)) {
    const isPathPartArrayIndex = !isNaN(Number(pathPart))
    if (isPathPartArrayIndex) {
      return doc[pathPart]
    }
    return doc.map(doc => pathPartToTarget(doc, pathParts))
  }
  return pathPartToTarget(doc[pathPart], pathParts.slice(1))
}

export const pathToValue = (doc: any, path: string) =>
  pathPartToTarget(doc, path.split('.'))

export const pathToTarget = (doc: any, path: string) =>
  pathPartToTarget(doc, path.split('.').slice(0, -1))

export const pathToKey = (path: string) =>
  path.split('.').pop()!
