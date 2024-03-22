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
