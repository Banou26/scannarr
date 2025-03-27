import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from "@libsql/client-wasm"

import initSQL from '../drizzle/_init.sql?raw'

const db = await createClient({ url: ':memory:' })
export const database = drizzle({ client: db })

await database.run(initSQL).execute()

console.log('database initialized')

await database.run(`INSERT INTO "users" ("name", "age", "email") VALUES ('John Doe', 42, 'john@doe.com')`).execute()

console.log('database.usersTable', await database.run(`SELECT * FROM users`).execute())

export default database
