import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from "@libsql/client-wasm"

// @ts-expect-error
import initSQL from '../../drizzle/_init.sql?raw'
import { users } from './schema'
import * as schema from './schema'

const db = await createClient({ url: ':memory:' })
export const database = drizzle({
  client: db,
  schema
})

await database.run(initSQL).execute()

export {
  users
}
// await database.run(`INSERT INTO "users" ("name", "age", "email") VALUES ('John Doe', 42, 'john@doe.com')`).execute()

export default database
