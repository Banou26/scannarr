
import _schema from './graphql'

export * from './generated/graphql'
export * from './utils'

export const schema: string = _schema

export { default as makeServer } from './server'

