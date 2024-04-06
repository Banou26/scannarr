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

export const pathToValue = (doc: any, path: string) =>
  path
    .split('.')
    .reduce(
      (doc, key) => {
        if (Array.isArray(doc)) {
          return doc.map(doc => doc[key])
        }
        return doc[key]
      },
      doc
    )

export const pathToTarget = (doc: any, path: string) =>
  path
    .split('.')
    .slice(0, -1)
    .reduce(
      (doc, key) => {
        if (Array.isArray(doc)) {
          return doc.map(doc => doc[key])
        }
        return doc[key]
      },
      doc
    )

export const pathToKey = (path: string) =>
  path.split('.').pop()!
