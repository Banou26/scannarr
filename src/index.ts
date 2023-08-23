
import _schema from './graphql'

export * from './generated/graphql'
export * from './utils'

export const schema: string = _schema

export { default as makeServer } from './server'
export { default as makeScannarr } from './apollo'
export { default as makeScannarr2 } from './urql/index'
