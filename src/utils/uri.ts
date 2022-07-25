import Handle from '../types/handle'

export type Uri = `${string}:${string}`

export const fromUri = (uri: Uri) => {
  const [scheme, id] = uri.split(':')
  return { scheme: scheme!, id: id! }
}

export const toUri = ({ scheme, id }: { scheme: string, id: string }): Uri => `${scheme}:${id}`

export const isUri = (uri: string) =>
  uri
    .split(':')
    .filter(part => part.length)
    .length === 2

export const populateUri = <T extends Partial<Pick<Handle, 'uri'>> & Omit<Handle, 'uri'>>(handle: T): T & Handle => ({
  ...handle,
  uri: toUri({ scheme: handle.scheme, id: handle.id })
})
