import { schema as schemaSchema } from './schema'
import { schema as characterSchema } from './character'
import { schema as externalLinkSchema } from './external-link'
import { schema as handleSchema } from './handle'
import { schema as mediaSchema } from './media'
import { schema as pageSchema } from './page'
import { schema as resourceSchema } from './resource'
import { schema as scalarsSchema } from './scalars'

export const schemas = [
  ['schema', schemaSchema],
  ['character', characterSchema],
  ['externalLink', externalLinkSchema],
  ['handle', handleSchema],
  ['media', mediaSchema],
  ['page', pageSchema],
  ['resource', resourceSchema],
  ['scalars', scalarsSchema]
]

export default (
  schemas
    .map(([schemaName, schema]) =>
      `\n# GraphQL Schema Scannarr (${schemaName})\n\n${schema}`
    )
    .join('\n\n\n')
)
