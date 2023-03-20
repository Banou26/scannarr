
import schema from './schema'
import character from './character'
import externalLink from './external-link'
import handle from './handle'
import media from './media'
import page from './page'
import resource from './resource'
import scalars from './scalars'

export const schemas = [
  ['schema', schema],
  ['character', character],
  ['externalLink', externalLink],
  ['handle', handle],
  ['media', media],
  ['page', page],
  ['resource', resource],
  ['scalars', scalars]
]

export default (
  schemas
    .map(([schemaName, schema]) =>
      `\n# GraphQL Schema Scannarr (${schemaName})\n\n${schema}`
    )
    .join('\n\n\n')
)
