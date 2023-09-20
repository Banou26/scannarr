import type { CodegenConfig } from '@graphql-codegen/cli'

import { defineConfig } from '@eddeee888/gcg-typescript-resolver-files'

import schema from './src/graphql'

const config: CodegenConfig = {
  schema,
  generates: {
    'src/generated/schema': defineConfig(),
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
        contextType: '../urql/client#ServerContext',
        scalars: {
          Uri: 'Uri'
        }
      }
    },
    './src/generated/graphql.schema.json': {
      plugins: [
        // 'introspection',
        'urql-introspection'
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
