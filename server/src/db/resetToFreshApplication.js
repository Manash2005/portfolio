import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from './database.js'
import { connectMongo, isMongoConnected } from './mongo.js'
import {
  EventModel,
  DsaAttemptModel,
  DsaRevisionScheduleModel,
  DsaMistakeJournalModel,
  DsaGameProfileModel,
  DsaAchievementUnlockModel,
  DsaDailyPlanModel,
} from '../models/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export async function resetToFreshApplication() {
  console.log('[Reset] Starting complete reset to 0 dummy data (fresh application)...')

  // 1. Reset SQLite
  const sqliteDb = getDatabase()
  sqliteDb.transaction(() => {
    sqliteDb.prepare('DELETE FROM events').run()
    sqliteDb.prepare('DELETE FROM dsa_attempts').run()
    sqliteDb.prepare('DELETE FROM dsa_revision_schedule').run()
    sqliteDb.prepare('DELETE FROM dsa_mistake_journal').run()
    sqliteDb.prepare('DELETE FROM dsa_daily_plans').run()
    sqliteDb.prepare('DELETE FROM dsa_ai_logs').run()
    sqliteDb.prepare('UPDATE dsa_achievements SET is_unlocked = 0, unlocked_at = NULL').run()
    sqliteDb.prepare(`
      UPDATE dsa_game_profile
      SET total_xp = 0,
          current_level = 'Novice',
          current_streak = 0,
          longest_streak = 0,
          last_active_date = NULL,
          streak_freeze_count = 2,
          penalties_enabled = 0,
          updated_at = datetime('now')
      WHERE id = 'primary_user'
    `).run()
  })()
  console.log('[Reset] SQLite tables cleared and game profile reset.')

  // 2. Reset MongoDB Atlas
  try {
    await connectMongo()
    if (isMongoConnected()) {
      await EventModel.deleteMany({})
      await DsaAttemptModel.deleteMany({})
      await DsaRevisionScheduleModel.deleteMany({})
      await DsaMistakeJournalModel.deleteMany({})
      await DsaDailyPlanModel.deleteMany({})
      await DsaAchievementUnlockModel.deleteMany({})
      await DsaGameProfileModel.findOneAndUpdate(
        { id: 'primary_user' },
        {
          _id: 'primary_user',
          id: 'primary_user',
          total_xp: 0,
          current_level: 'Novice',
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
          streak_freeze_count: 2,
          penalties_enabled: 0,
          updated_at: new Date().toISOString(),
        },
        { upsert: true }
      )
      console.log('[Reset] MongoDB Atlas collections cleared and game profile reset.')
    } else {
      console.warn('[Reset] MongoDB not connected, skipped Mongo collection clearing.')
    }
  } catch (err) {
    console.error('[Reset] MongoDB reset error:', err.message)
  }

  console.log('[Reset] Fresh application state achieved (0 dummy data).')
}

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  resetToFreshApplication().then(() => {
    process.exit(0)
  }).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
