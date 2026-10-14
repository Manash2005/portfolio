import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { seedInitialData } from './seedInitialData.js'
import { seedDsaCatalog } from './seedDsaCatalog.js'

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

function ensureSchemaUpgrades(db) {
  try {
    const hasProjects = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='projects'").get().c > 0
    if (hasProjects) {
      const projectCols = db.prepare("PRAGMA table_info(projects)").all().map(c => c.name)
      const requiredProjectCols = [
        { name: 'short_description', type: 'TEXT' },
        { name: 'outcome', type: 'TEXT' },
        { name: 'problem', type: 'TEXT' },
        { name: 'architecture', type: 'TEXT' },
        { name: 'key_challenge', type: 'TEXT' },
        { name: 'solution', type: 'TEXT' },
        { name: 'metrics', type: 'TEXT' },
        { name: 'image', type: 'TEXT' },
        { name: 'featured', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'reflection', type: 'TEXT' },
        { name: 'is_published', type: 'INTEGER NOT NULL DEFAULT 1' },
        { name: 'display_order', type: 'INTEGER NOT NULL DEFAULT 0' }
      ]

      for (const col of requiredProjectCols) {
        if (!projectCols.includes(col.name)) {
          db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`)
        }
      }
    }
  } catch (err) {
    console.error('Schema upgrade check error:', err)
  }
}

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath)
    // Performance & safety pragmas
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('foreign_keys = ON')
    dbInstance.pragma('busy_timeout = 5000')

    // 1. Initialize core Second Brain & Admin schema (schema.sql)
    const schemaPath = path.join(__dirname, 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
      dbInstance.exec(schemaSql)
    }

    // 2. Initialize DSA schema (dsaSchema.sql)
    const dsaSchemaPath = path.join(__dirname, 'dsaSchema.sql')
    if (fs.existsSync(dsaSchemaPath)) {
      const dsaSchemaSql = fs.readFileSync(dsaSchemaPath, 'utf8')
      dbInstance.exec(dsaSchemaSql)
    }

    // 3. Run schema upgrades for projects if table exists
    ensureSchemaUpgrades(dbInstance)

    // 4. Auto-seed core goals, projects, and events if projects table is empty
    try {
      const projectCount = dbInstance.prepare("SELECT count(*) as c FROM projects").get().c
      if (projectCount === 0) {
        console.log('[Database] Empty projects detected — running initial seed...')
        seedInitialData(dbInstance)
      }
    } catch (err) {
      console.error('Projects seed check error:', err)
    }

    // 5. Auto-seed curated DSA catalog if empty
    try {
      const problemCount = dbInstance.prepare("SELECT count(*) as c FROM dsa_problems").get().c
      if (problemCount === 0) {
        seedDsaCatalog(dbInstance)
      }
    } catch (err) {
      console.error('DSA count check error:', err)
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


