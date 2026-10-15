import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Strictly enforce isolated test environment
process.env.NODE_ENV = 'test'
process.env.SQLITE_DB_PATH = path.resolve(__dirname, '../data/second_brain.test.db')
