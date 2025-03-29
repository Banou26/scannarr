import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs'
import * as SQLite from 'wa-sqlite'

import initMigration from '../../prisma/init.sql?raw'
import type { PrivateResultType } from '../../prisma/generated/runtime/library'
import { getAllMedia } from '../../prisma/generated/sql'

const module = await SQLiteESMFactory()
const sqlite3 = SQLite.Factory(module)
const db = await sqlite3.open_v2('myDB')

console.log('initMigration', initMigration)

await sqlite3.exec(db, initMigration, (row, columns) => {
  console.log(row, columns)
})

/**
 * Run a query with placeholders and parameters
 * This function is for queries that don't return data (INSERT, UPDATE, DELETE, etc.)
 * @param {string} sql - SQL query with placeholders (?)
 * @param {Array} params - Array of parameters to bind
 * @returns {Promise<number>} - Number of changes made by the query
 */
export async function runQuery(sql, params = []) {
  if (!db || !sqlite3) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  try {
    // Use the statements iterator to handle the SQL
    for await (const stmt of sqlite3.statements(db, sql)) {
      // Bind parameters if any
      if (params.length > 0) {
        sqlite3.bind_collection(stmt, params);
      }
      
      // Execute the statement
      await sqlite3.step(stmt);
    }
    
    // Return the number of changes
    return sqlite3.changes(db);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    throw error;
  }
}

/**
 * Execute a query and return all results (for SELECT queries)
 * @param {string} sql - SQL query with placeholders (?)
 * @param {Array} params - Array of parameters to bind
 * @returns {Promise<Array>} - Array of result objects
 */
export async function getQueryResults(sql, params = []) {
  if (!db || !sqlite3) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  try {
    const results: Record<string, SQLiteCompatibleType>[] = [];
    
    // Use the statements iterator to handle the SQL
    for await (const stmt of sqlite3.statements(db, sql)) {
      // Bind parameters if any
      if (params.length > 0) {
        sqlite3.bind_collection(stmt, params);
      }
      
      // Get column names
      const columnNames = sqlite3.column_names(stmt);
      
      // Execute the statement and collect results
      while (await sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
        // Use the row() function to get all columns at once
        const rowData = sqlite3.row(stmt);
        
        // Convert array to object with column names
        const rowObj: Record<string, SQLiteCompatibleType> = {};
        for (let i = 0; i < columnNames.length; i++) {
          rowObj[columnNames[i]] = rowData[i];
        }
        
        results.push(rowObj);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// type test = ReturnType<typeof assetLatestPools>[typeof PrivateResultType]

console.log('exec',
  await runQuery(`INSERT INTO media (id, name) VALUES (?, ?)`, ['1', 'test'])
)

console.log('assetLatestPools', await getQueryResults(`SELECT m.* FROM media m`))

// await sqlite3.exec(db, initMigration, (row, columns) => {
//   console.log(row, columns)
// })

