import type { CodegenConfig } from '@graphql-codegen/cli'

import schema from './src/graphql'

const config: CodegenConfig = {
  schema,
  generates: {
    './src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-resolvers',
        'typescript-document-nodes',
        {
          add: {
            content: `import { Uri } from '../utils/uri'`
          }
        }
      ],
      config: {
        useTypeImports: true,
        contextType: '../server#Context',
        scalars: {
          Uri: 'Uri'
        }
      }
    },
    './src/generated/graphql.schema.json': {
      plugins: [
        'introspection',
        {
          add: {
            content: `import BigNumber from '../utils/uri'`
          }
        }
      ],
      config: {
        scalars: {
          Uri: 'string'
        }
      }
    }
  },
  ignoreNoDocuments: true,
}

export default config
