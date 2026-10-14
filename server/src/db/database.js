import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database path: support custom path via environment or default to server/data/second_brain.db
const defaultDbPath = path.resolve(__dirname, '../../data/second_brain.db')
const dbPath = process.env.SQLITE_DB_PATH || defaultDbPath

// Ensure directory exists
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

let dbInstance = null

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath)
    // Performance & safety pragmas
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('foreign_keys = ON')
    dbInstance.pragma('busy_timeout = 5000')

    // Initialize schema if not present
    const schemaPath = path.join(__dirname, 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
      dbInstance.exec(schemaSql)
    }
  }
  return dbInstance
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export const db = getDatabase()
