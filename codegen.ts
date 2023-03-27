import type { CodegenConfig } from '@graphql-codegen/cli'

import schema from './src/graphql'

const config: CodegenConfig = {
  schema,
  generates: {
    './src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers', 'typescript-document-nodes'],
      config: {
        useTypeImports: true,
        contextType: '../server#Context'
      }
    },
    './src/generated/graphql.schema.json': {
      plugins: ['introspection']
    }
  },
  ignoreNoDocuments: true,
}

export default config
