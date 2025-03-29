import type { TypedSql } from '../../prisma/generated/runtime/library'

import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs'
import * as SQLite from 'wa-sqlite'

// @ts-expect-error
import initMigration from '../../prisma/init.sql?raw'

const module = await SQLiteESMFactory()
const sqlite3 = SQLite.Factory(module)
const db = await sqlite3.open_v2('myDB')

await sqlite3.exec(db, initMigration)

const run = async (sql, params = [] as any[]) => {
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (params.length > 0) {
      sqlite3.bind_collection(stmt, params)
    }
    await sqlite3.step(stmt)
  }
  return sqlite3.changes(db)
}

export const runQuery = async <T2 extends unknown[], T3 extends Record<string, SQLiteCompatibleType>, T extends (...args: T2) => TypedSql<T2, T3>>(sql: T, params: T2) => {
    for await (const stmt of sqlite3.statements(db, sql(...params).sql)) {
      if (params.length > 0) {
        sqlite3.bind_collection(stmt, params as SQLiteCompatibleType[])
      }
      await sqlite3.step(stmt)
    }
    return sqlite3.changes(db)
}

export async function getQueryResults<T2 extends unknown[], T3 extends Record<string, SQLiteCompatibleType>, T extends (...args: T2) => TypedSql<T2, T3>>(sql: T, params: T2) {
  const results: T3[] = []
    
  for await (const stmt of sqlite3.statements(db, sql(...params).sql)) {
    if (params.length > 0) {
      sqlite3.bind_collection(stmt, params as SQLiteCompatibleType[])
    }
    
    const columnNames = sqlite3.column_names(stmt)
    
    while (await sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
      const rowData = sqlite3.row(stmt)
      
      results.push(
        Object.fromEntries(
          columnNames.map((columnName, index) => [columnName, rowData[index]])
        ) as T3
      )
    }
  }
  
  return results
}

export async function transaction(callback) {
  try {
    await run('BEGIN TRANSACTION')
    await callback()
    await run('COMMIT')
  } catch (error) {
    await run('ROLLBACK')
    throw error
  }
}
