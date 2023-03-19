import type { CodegenConfig } from '@graphql-codegen/cli'

import { readdirSync } from 'fs'

const schemasFolder = readdirSync('./src/graphql')

const schemasfileNames =
  schemasFolder
    .filter(fileName => fileName.endsWith('.gql'))
    .map(fileName => `./src/graphql/${fileName}`)

const config: CodegenConfig = {
  schema: schemasfileNames,
  generates: {
    // './src/generated/': {
    //   preset: 'client',
    //   config: {
    //     dedupeFragments: true
    //   },
    //   presetConfig: {
    //     gqlTagName: 'gql',
    //     fragmentMasking: false
    //   }
    // }
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
