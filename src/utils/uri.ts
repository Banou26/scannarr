import Handle from '../types/handle'

export type Uri = `${string}:${string}`
type Separated<S extends string> = `${S}${''|`,${S}`}`
type Uris = Separated<Separated<Uri>>

export type UriValues = {
  id: string
  scheme: string
}

export const fromUri = (uri: Uri): UriValues => {
  const [scheme, id] = uri.split(':') as [string, string]
  return { scheme: scheme, id: id }
}

export const fromUris = <T extends string | undefined = undefined>(uriString: Uris, schemeSearch?: T): T extends string ? UriValues : UriValues[] => {
  const uris = uriString.split(',') as Uri[]
  const result = uris.map((uri) => fromUri(uri))
  if (schemeSearch) return result.find(({ scheme }) => scheme === schemeSearch) as T extends string ? UriValues : UriValues[]
  return result as T extends string ? UriValues : UriValues[]
}

export const toUri = ({ id, scheme }: { id: string, scheme: string }): Uri => `${scheme}:${id}`

export const isUri = (uri: string): uri is Uri =>
  uri
    .split(':')
    .filter(part => part.length)
    .length === 2

export const isUris = (uri: string): uri is Uris =>
  uri
    .split(',')
    .every(isUri)

export const populateUri = <T extends Partial<Pick<Handle, 'uri'>> & Omit<Handle, 'uri'>>(handle: T): T & Handle => ({
  ...handle,
  uri: toUri({ scheme: handle.scheme, id: handle.id })
})
