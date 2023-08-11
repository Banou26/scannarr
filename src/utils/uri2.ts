import { Handle } from '../generated/graphql'
import { groupBy } from './groupBy'

export type Uri = `${string}:${string}`

type Separated<S extends string> = `${S}${''|`,${S}`}`

export type Uris = Separated<Separated<Uri>>

export type UriValues = {
  origin: string
  id: string
}

export const fromUri = (uri: Uri): UriValues => {
  const [origin, id] = uri.split(':') as [string, string]
  return { origin, id }
}

export const fromUris = <T extends string | undefined = undefined>(uriString: Uris, schemeSearch?: T): T extends string ? UriValues : UriValues[] => {
  const uris = uriString.split(',') as Uri[]
  const result = uris.map((uri) => fromUri(uri))
  if (schemeSearch) return result.find(({ origin }) => origin === schemeSearch) as T extends string ? UriValues : UriValues[]
  return result as T extends string ? UriValues : UriValues[]
}

export const toUri = (
  { origin, id }:
  { origin: string, id: string }
): Uri => `${origin}:${id}`

export const joinUris = (uris: Uri[]) => uris.join(',') as Uris
export const splitUris = (uris: Uris) => uris.split(',') as Uri[]

export const isUri = (uri: string): uri is Uri => {
  const parts =
    uri
      .split(':')
      .filter(part => part.length)

  if (parts[1]?.includes(',')) throw new Error(`Invalid uri: ${uri}, contains "," character in id`)

  return parts.length === 2
}

export const isUris = (uri: string): uri is Uris =>
  uri
    .split(',')
    .every(isUri)

export const populateUri = <T extends Partial<Pick<Handle, 'uri'>> & Omit<Handle, 'uri'>>(handle: T): T & Handle => ({
  ...handle,
  uri: toUri({ origin: handle.origin, id: handle.id }),
  url: handle.url
})

export type ScannarrUri = `scannarr:(${Uris})${''|`-${string}`}`

const SCANNARR_REGEX = /scannarr:\((.*)\)(?:-(.*))?/

export const isScannarrUri = (uri: string): uri is ScannarrUri => {
  if (!uri.startsWith('scannarr:')) return false
  const match = uri.match(SCANNARR_REGEX)
  if (!match) return false
  const uris = match?.[1]
  // allow empty scannarr uris
  return !uris || isUris(uris)
}

export const toScannarrUri = <T extends Uri[] | Uris>(uris: T, episode?: string) =>
  `scannarr:(${toScannarrId(uris)})${episode ? `-${episode}` : ''}` as ScannarrUri

export const toScannarrId = <T extends Uri[] | Uris>(uris: T): string =>
  encodeURI(
    Array.isArray(uris)
      ? uris.join(',')
      : uris
  )

export const fromScannarrUri = (uri: ScannarrUri) => {
  const match = uri.match(SCANNARR_REGEX)
  return match && ({
    uri: match[0] as Uri,
    origin: 'scannarr' as const,
    id: match[0].replace('scannarr:', ''),
    handleUris: splitUris(match[1] as Uris),
    handleUrisString: match[1] as Uris,
    handleUrisValues: fromUris(match[1] as Uris),
    episodeId: match[2] as string
  })
}

export const mergeScannarrUris = (uris: ScannarrUri[]) =>
  toScannarrUri(
    [
      ...groupBy(
        uris
          .flatMap(uri =>
            fromScannarrUri(uri as ScannarrUri)
              ?.handleUrisValues
          ),
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