// @ts-expect-error
import schema from './schema.gql?raw'
// @ts-expect-error
import character from './character.gql?raw'
// @ts-expect-error
import externalLink from './external-link.gql?raw'
// @ts-expect-error
import handle from './handle.gql?raw'
// @ts-expect-error
import media from './media.gql?raw'
// @ts-expect-error
import pageInfo from './page-info.gql?raw'
// @ts-expect-error
import resource from './resource.gql?raw'
// @ts-expect-error
import scalars from './scalars.gql?raw'

export const schemas = [
  ['schema', schema],
  ['character', character],
  ['externalLink', externalLink],
  ['handle', handle],
  ['media', media],
  ['pageInfo', pageInfo],
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
