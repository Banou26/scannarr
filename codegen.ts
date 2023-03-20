import type { CodegenConfig } from '@graphql-codegen/cli'

import { readdirSync, readFileSync } from 'fs'

const schemasFolder = readdirSync('./src/graphql')

const schemasfileNames =
  schemasFolder
    .filter(fileName => fileName.endsWith('.gql'))
    .map(fileName => readFileSync(fileName, 'utf8'))

const config: CodegenConfig = {
  schema: schemasfileNames,
  generates: {
    './src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers', 'typescript-document-nodes'],
      config: {
        useTypeImports: true
      }
    },
    './src/generated/graphql.schema.json': {
      plugins: ['introspection']
    }
  },
  ignoreNoDocuments: true,
}

export default config
