import { db } from './database.js'

export function cleanDummyData() {
  console.log('[Cleanup] Removing test/dummy data while preserving genuine user solve for Binary Search (lc-704)...')

  // 1. Delete test attempts (keep ONLY lc-704 Binary Search)
  const delAttempts = db.prepare("DELETE FROM dsa_attempts WHERE problem_id != 'lc-704'").run()
  console.log(`Deleted ${delAttempts.changes} dummy attempt(s).`)

  // 2. Delete test mistakes
  const delMistakes = db.prepare("DELETE FROM dsa_mistake_journal WHERE problem_id != 'lc-704'").run()
  console.log(`Deleted ${delMistakes.changes} dummy mistake(s).`)

  // 3. Delete dummy revision schedules
  const delRevisions = db.prepare("DELETE FROM dsa_revision_schedule WHERE problem_id != 'lc-704'").run()
  console.log(`Deleted ${delRevisions.changes} dummy revision item(s).`)

  // 4. Delete dummy event from tests (Two Sum)
  const delEvents = db.prepare("DELETE FROM events WHERE title LIKE '%Two Sum%'").run()
  console.log(`Deleted ${delEvents.changes} dummy calendar event(s).`)

  // 5. Delete test plans & logs
  db.prepare("DELETE FROM dsa_daily_plans").run()
  db.prepare("DELETE FROM dsa_ai_logs").run()

  // 6. Reset achievements to 0 unlocks, then unlock first_solve
  db.prepare("UPDATE dsa_achievements SET is_unlocked = 0, unlocked_at = NULL").run()
  db.prepare("UPDATE dsa_achievements SET is_unlocked = 1, unlocked_at = datetime('now') WHERE id = 'first_solve'").run()

  // 7. Calculate real XP for lc-704 solve: 50 base + 30 independent + 20 speed (<10m) = 100 XP + 50 XP achievement = 150 XP
  db.prepare(`
    UPDATE dsa_game_profile 
    SET total_xp = 150,
        current_level = 'Novice',
        current_streak = 1,
        longest_streak = 1,
        last_active_date = date('now'),
        streak_freeze_count = 2,
        penalties_enabled = 0,
        updated_at = datetime('now')
    WHERE id = 'primary_user'
  `).run()

  // 8. Ensure lc-704 has proper revision schedule (upcoming in 3 days)
  db.prepare(`
    INSERT INTO dsa_revision_schedule (problem_id, last_solved_at, next_revision_due, interval_days, repetition_count, ease_factor, status, updated_at)
    VALUES ('lc-704', date('now'), date('now', '+3 days'), 3, 1, 2.5, 'upcoming', datetime('now'))
    ON CONFLICT(problem_id) DO UPDATE SET
      last_solved_at = date('now'),
      next_revision_due = date('now', '+3 days'),
      status = 'upcoming',
      updated_at = datetime('now')
  `).run()

  console.log('[Cleanup] Data cleanup finished successfully!')
}

cleanDummyData()
