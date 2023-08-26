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
  const result =
    uris
      .filter(Boolean)
      .map((uri) => fromUri(uri))
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

export const populateHandle = <T extends Partial<Pick<Handle, 'uri'>> & Omit<Handle, 'uri'>>(handle: T): T & Handle => ({
  uri: toUri({ origin: handle.origin, id: handle.id }),
  url: handle.url ?? null,
  ...handle,
  handles: handle.handles ?? {
    edges: [],
    nodes: []
  }
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

export const toScannarrId = <T extends Uri[] | Uris>(uris: T, sort = true): string =>
  sort
    ? toScannarrId(
      (
        fromUris(
          Array.isArray(uris)
            ? uris.join(',') as Uris
            : uris
        )
      )
        .filter(elem => elem.origin && elem.id)
        .sort((a, b) => a.id.localeCompare(b.id))
        .sort((a, b) => a.origin.localeCompare(b.origin))
        .map(toUri),
      false
    )
    : (
      encodeURI(
        Array.isArray(uris)
          ? uris.join(',')
          : uris
      )
    )

export const fromScannarrUri = (uri: ScannarrUri) => {
  const match = uri.match(SCANNARR_REGEX)
  if (!match) return undefined
  const uris =
    fromUris(match[1] as Uris)
      .filter(elem => elem.origin && elem.id)
      .sort((a, b) => a.id.localeCompare(b.id))
      .sort((a, b) => a.origin.localeCompare(b.origin))
  return match && ({
    uri: `scannarr:(${joinUris(uris.map(toUri))})` as Uri,
    origin: 'scannarr' as const,
    id: `(${joinUris(uris.map(toUri))})`,
    handleUris: uris.map(toUri),
    handleUrisString: joinUris(uris.map(toUri)), // match[1] as Uris,
    handleUrisValues: uris,
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

export const toUriEpisodeId = (uri: Uri, episodeId: string | number) => `${uri}-${episodeId}`
export const fromUriEpisodeId = (uri: Uri) => console.log() || ({
  uri: [...[...(uri as string)].reverse().join('').split('-').slice(1).join('-')].reverse().join('') as Uri,
  episodeId: [...(uri as string)].reverse().join('').split('-').at(0) as string
})
