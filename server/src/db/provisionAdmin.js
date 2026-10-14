import { hasAdminUser, provisionAdmin } from '../auth/authService.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export function autoProvisionFromEnv() {
  const username = process.env.ADMIN_USERNAME || 'manash'
  const password = process.env.ADMIN_PASSWORD

  if (username && password) {
    try {
      const result = provisionAdmin(username, password)
      console.log(`[Admin Provisioning] Synced admin account from .env: ${result.username}`)
    } catch (err) {
      console.error('[Admin Provisioning Error]', err.message)
    }
  } else if (!hasAdminUser()) {
    try {
      const result = provisionAdmin('manash', 'ManashAdmin2026!')
      console.log(`[Admin Provisioning] Initialized default admin account: ${result.username}`)
    } catch (err) {
      console.error('[Admin Provisioning Error]', err.message)
    }
  }
}

// CLI execution support
if (process.argv[1] && process.argv[1].endsWith('provisionAdmin.js')) {
  const [,, userArg, passArg] = process.argv
  const username = userArg || process.env.ADMIN_USERNAME || 'manash'
  const password = passArg || process.env.ADMIN_PASSWORD || 'ManashAdmin2026!'

  try {
    const res = provisionAdmin(username, password)
    console.log(`[Success] Admin user "${res.username}" ${res.created ? 'created' : 'password updated'} successfully.`)
    process.exit(0)
  } catch (err) {
    console.error(`[Error] Failed to provision admin: ${err.message}`)
    process.exit(1)
  }
}
