import { Handle } from '../generated/graphql'

export type Uri = `${`${string}:` | ''}${string}:${string}`

type Separated<S extends string> = `${S}${''|`,${S}`}`

export type Uris = Separated<Separated<Uri>>

export type UriValues = {
  id: string
  origin: string
}

export const fromUri = (uri: Uri): UriValues => {
  const [origin, id] = uri.split(':') as [string, string]
  return { origin: origin, id: id }
}

export const fromUris = <T extends string | undefined = undefined>(uriString: Uris, schemeSearch?: T): T extends string ? UriValues : UriValues[] => {
  const uris = uriString.split(',') as Uri[]
  const result = uris.map((uri) => fromUri(uri))
  if (schemeSearch) return result.find(({ origin }) => origin === schemeSearch) as T extends string ? UriValues : UriValues[]
  return result as T extends string ? UriValues : UriValues[]
}

export const toUri = (
  { handler, origin, id }:
  { handler?: string, origin: string, id: string }
): Uri => `${handler ? `${handler}:` : ''}${origin}:${id}`

export const isUri = (uri: string): uri is Uri => {
  const parts =
    uri
      .split(':')
      .filter(part => part.length)

  return parts.length === 2 || parts.length === 3
}

export const isUris = (uri: string): uri is Uris =>
  uri
    .split(',')
    .every(isUri)

export const populateUri = <T extends Partial<Pick<Handle, 'uri' | 'handler'>> & Omit<Handle, 'uri' | 'handler'>>(handle: T): T & Handle => ({
  ...handle,
  handler: handle.handler ? handle.handler : 'fkn',
  uri: toUri({ handler: handle.handler, origin: handle.origin, id: handle.id }),
  url: handle.url ? handle.url : undefined
})

const BASE64_REGEX = /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/

export const toScannarrUri = (uris: Uris): Uri => `scannarr:${btoa(uris)}`
export const toScannarrId = (uris: Uris): string => btoa(uris)
export const fromScannarrUri = (uri: Uri): Uri[] => atob(uri.split(':')[1]!.match(BASE64_REGEX)![0]).split(',') as Uri[]
export const getScannarrUriEpisodeNumber = (uri: Uri) => uri.split('-')[1]

