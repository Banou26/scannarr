
export type ShallowHandle = {
  /** Scheme of the material's origin, usually a short string */
  scheme: string
  /** ID of the material */
  id: string
  /** URI of the material, used to reference this handle, its format is `scheme:uri` */
  uri: string
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
