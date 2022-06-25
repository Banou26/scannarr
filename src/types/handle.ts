import type { Uri } from '../utils/uri'

export type ShallowHandle = {
  /** ID of the material */
  id: string
  /** Scheme of the material's origin, usually a short string */
  scheme: string
  /** URI of the material, used to reference this handle, its format is `scheme:uri` */
  uri: Uri
  /** URL of the material, if there is any */
  url?: string
  /**
   * Boolean indicating whether the handle has details data
   * This means the handle contains all possible informations
   */
  withDetails?: boolean
}

export type Handle =
  ShallowHandle & {
    /** Other references to the same material */
    handles?: Handle[]
  }

export default Handle

export const EqByUri = {
  equals: (handle: Handle, handle2: Handle) => handle.uri === handle2.uri
}
