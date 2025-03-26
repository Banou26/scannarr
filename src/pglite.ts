import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

export const pglite = new PGlite()

export const database = drizzle({ client: pglite })

export default database
