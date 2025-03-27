import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'sqlite',
  migrations: {
    prefix: 'none'
  }
})
