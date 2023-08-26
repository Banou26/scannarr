import { Handle } from '../generated/graphql'
import { groupBy } from './groupBy'

export type Uri = `${`${string}:` | ''}${string}:${string}`

type Separated<S extends string> = `${S}${''|`,${S}`}`

export type Uris = Separated<Separated<Uri>>

export type UriValues = {
  handler?: string
  origin: string
  id: string
}

export const fromUri = (uri: Uri): UriValues => {
  const splits = uri.split(':') as [string, string, string] | [string, string]
  const [handler, origin, id] =
    splits.length <= 2
      ? [undefined, ...splits]
      : splits as [string, string, string]
  return { handler, origin, id }
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

export const joinUris = (uris: Uri[]): Uri => uris.join(',')

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

export const populateHandle = <T extends Partial<Pick<Handle, 'uri' | 'handler'>> & Omit<Handle, 'uri' | 'handler'>>(handle: T): T & Handle => ({
  ...handle,
  handler: handle.handler ? handle.handler : 'fkn',
  uri: toUri({ handler: handle.handler, origin: handle.origin, id: handle.id }),
  url: handle.url
})

const BASE64_REGEX = /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/

export const isScannarrUri = (uri: Uri): boolean => uri.startsWith('scannarr:')
export const toScannarrUri = (uris: Uris): Uri => `scannarr:${btoa(uris)}`
export const toScannarrId = (uris: Uris): string => btoa(uris)
export const fromScannarrUri = (uri: Uri): Uri[] => atob(uri.split(':')[1]!.match(BASE64_REGEX)![0]).split(',') as Uri[]
export const toUriEpisodeId = (uri: Uri, episodeId: string) => `${uri}-${episodeId}`
export const fromUriEpisodeId = (uri: Uri) => ({
  uri: uri.split('-')[0] as Uri,
  episodeId: uri.split('-')[1] as string
})

export const mergeScannarrUris = (uris: Uri[]) =>
  toScannarrUri(
    [
      ...groupBy(
        uris
          .flatMap(uri => fromScannarrUri(uri ?? ''))
          .map(uri => fromUri(uri)),
        uri => uri.origin
      )
    ].map(([origin, uris]) =>
      toUri(
        uris
          .sort((a, b) => b.id - a.id)
          .at(-1)
      )
    ) as unknown as Uris
  )