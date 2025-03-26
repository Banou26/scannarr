import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

import initSQL from '../drizzle/_init.sql?raw'

export const pglite = new PGlite()

export const database = drizzle({ client: pglite })

await database.execute(initSQL).execute()

console.log('database initialized')

await database.execute(`INSERT INTO "users" ("name", "age", "email") VALUES ('John Doe', 42, 'john@doe.com')`).execute()

console.log('database.usersTable', await database.execute(`SELECT * FROM users`).execute())

export default database
