import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const usersTable = sqliteTable('users', {
  id: integer().primaryKey(),
  name: text({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: text({ length: 255 }).notNull().unique(),
})
