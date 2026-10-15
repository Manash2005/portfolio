import { db } from '../db/database.js'
import {
  persistGameProfileToMongo,
  persistAchievementUnlockToMongo,
} from '../db/mongoPersistence.js'

export const LEVELS = [
  { name: 'Novice', minXp: 0, maxXp: 199, icon: 'Shield' },
  { name: 'Apprentice', minXp: 200, maxXp: 499, icon: 'Compass' },
  { name: 'Problem Solver', minXp: 500, maxXp: 999, icon: 'Target' },
  { name: 'Algorithm Explorer', minXp: 1000, maxXp: 1999, icon: 'Award' },
  { name: 'DSA Specialist', minXp: 2000, maxXp: 3999, icon: 'Zap' },
  { name: 'Interview Ready', minXp: 4000, maxXp: Infinity, icon: 'Trophy' },
]

export function getLevelForXp(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      const current = LEVELS[i]
      const next = LEVELS[i + 1] || null
      const xpInLevel = xp - current.minXp
      const levelSpan = next ? next.minXp - current.minXp : 1000
      const progressPercent = next ? Math.min(100, Math.round((xpInLevel / levelSpan) * 100)) : 100

      return {
        level: current.name,
        icon: current.icon,
        currentXp: xp,
        minXp: current.minXp,
        nextLevelXp: next ? next.minXp : null,
        nextLevel: next ? next.name : null,
        progressPercent,
      }
    }
  }
  return {
    level: 'Novice',
    icon: 'Shield',
    currentXp: xp,
    minXp: 0,
    nextLevelXp: 200,
    nextLevel: 'Apprentice',
    progressPercent: 0,
  }
}

/**
 * Get or initialize game profile
 */
export function getGameProfile() {
  let profile = db.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')
  if (!profile) {
    db.prepare(`
      INSERT INTO dsa_game_profile (id, total_xp, current_level, current_streak, longest_streak)
      VALUES ('primary_user', 0, 'Novice', 0, 0)
    `).run()
    profile = db.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')
  }

  const levelInfo = getLevelForXp(profile.total_xp)

  // Fetch achievements summary
  const achievements = db.prepare('SELECT * FROM dsa_achievements ORDER BY xp_reward ASC').all()
  const unlockedCount = achievements.filter((a) => a.is_unlocked === 1).length

  return {
    ...profile,
    levelInfo,
    achievements,
    unlockedAchievementsCount: unlockedCount,
    totalAchievementsCount: achievements.length,
  }
}

/**
 * Update game streak and award XP safely
 */
export function recordActivityReward({ xpEarned, durationSeconds = 0, isRevision = false }) {
  const profile = getGameProfile()
  const today = new Date().toISOString().split('T')[0]

  let newStreak = profile.current_streak
  let newFreezes = profile.streak_freeze_count
  let streakMaintained = false

  if (!profile.last_active_date) {
    newStreak = 1
    streakMaintained = true
  } else if (profile.last_active_date === today) {
    // Already practiced today, keep current streak
    streakMaintained = true
  } else {
    // Calculate calendar day difference
    const lastDate = new Date(profile.last_active_date)
    const currDate = new Date(today)
    const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      newStreak += 1
      streakMaintained = true
    } else if (diffDays === 2 && profile.streak_freeze_count > 0 && profile.penalties_enabled === 1) {
      // Use streak freeze
      newFreezes -= 1
      streakMaintained = true
    } else {
      // Streak reset (Permanent XP is NEVER lost)
      newStreak = 1
    }
  }

  const newLongestStreak = Math.max(profile.longest_streak, newStreak)
  const newTotalXp = profile.total_xp + Math.max(0, xpEarned)
  const newLevelInfo = getLevelForXp(newTotalXp)

  db.prepare(`
    UPDATE dsa_game_profile
    SET total_xp = ?,
        current_level = ?,
        current_streak = ?,
        longest_streak = ?,
        last_active_date = ?,
        streak_freeze_count = ?,
        updated_at = datetime('now')
    WHERE id = 'primary_user'
  `).run(newTotalXp, newLevelInfo.level, newStreak, newLongestStreak, today, newFreezes)

  // Persist game profile to MongoDB Atlas
  const updatedProfile = db.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')
  if (updatedProfile) {
    persistGameProfileToMongo(updatedProfile).catch(() => {})
  }

  // Check achievements
  const unlockedNow = checkAchievements({
    totalXp: newTotalXp,
    streak: newStreak,
    durationSeconds,
  })

  return {
    totalXp: newTotalXp,
    xpAwarded: xpEarned,
    levelInfo: newLevelInfo,
    streak: newStreak,
    longestStreak: newLongestStreak,
    streakMaintained,
    unlockedAchievements: unlockedNow,
  }
}

/**
 * Check achievement requirements against real database records
 */
export function checkAchievements({ totalXp, streak, durationSeconds = 0 }) {
  const unlocked = []

  // Count total solved problems
  const solvesRow = db
    .prepare(
      `SELECT COUNT(DISTINCT problem_id) as count 
       FROM dsa_attempts 
       WHERE result = 'solved'`
    )
    .get()
  const totalSolves = solvesRow ? solvesRow.count : 0

  // Count independent solves
  const indSolvesRow = db
    .prepare(
      `SELECT COUNT(DISTINCT problem_id) as count 
       FROM dsa_attempts 
       WHERE result = 'solved' AND is_independent = 1`
    )
    .get()
  const indSolves = indSolvesRow ? indSolvesRow.count : 0

  // Count hard solves
  const hardSolvesRow = db
    .prepare(
      `SELECT COUNT(DISTINCT a.problem_id) as count 
       FROM dsa_attempts a 
       JOIN dsa_problems p ON a.problem_id = p.id
       WHERE a.result = 'solved' AND p.difficulty = 'Hard' AND a.is_independent = 1`
    )
    .get()
  const hardSolves = hardSolvesRow ? hardSolvesRow.count : 0

  // Count distinct topics solved (polyglot)
  const topicsRow = db
    .prepare(
      `SELECT COUNT(DISTINCT p.primary_topic) as count
       FROM dsa_attempts a 
       JOIN dsa_problems p ON a.problem_id = p.id
       WHERE a.result = 'solved'`
    )
    .get()
  const solvedTopicsCount = topicsRow ? topicsRow.count : 0

  // Topic-specific counts
  const getTopicSolves = (pattern) => {
    const row = db
      .prepare(
        `SELECT COUNT(DISTINCT a.problem_id) as count 
         FROM dsa_attempts a 
         JOIN dsa_problems p ON a.problem_id = p.id
         WHERE a.result = 'solved' AND p.primary_topic LIKE ?`
      )
      .get(pattern)
    return row ? row.count : 0
  }

  const bsSolves = getTopicSolves('%Binary Search%')
  const treeSolves = getTopicSolves('%Tree%')
  const stringSolves = getTopicSolves('%String%')
  const twoPointerSolves = getTopicSolves('%Two Pointer%') + getTopicSolves('%Sliding Window%')
  const bitSolves = getTopicSolves('%Bit%')
  const heapSolves = getTopicSolves('%Heap%')
  const trieSolves = getTopicSolves('%Trie%')
  const btSolves = getTopicSolves('%Backtrack%')
  const graphSolves = getTopicSolves('%Graph%') + getTopicSolves('%Topological%') + getTopicSolves('%Shortest%')
  const dpSolves = getTopicSolves('%Dynamic Programming%')

  // Count revisions
  const revisionsRow = db
    .prepare(
      `SELECT repetition_count FROM dsa_revision_schedule WHERE repetition_count >= 2`
    )
    .all()
  const completedRevisions = revisionsRow.length

  // Count mistake reflections
  const mistakesRow = db.prepare('SELECT count(*) as count FROM dsa_mistake_journal').get()
  const mistakeReflections = mistakesRow ? mistakesRow.count : 0

  const unlockAchievement = (id) => {
    const ach = db.prepare('SELECT * FROM dsa_achievements WHERE id = ?').get(id)
    if (ach && ach.is_unlocked === 0) {
      const nowStr = new Date().toISOString()
      db.prepare(`
        UPDATE dsa_achievements 
        SET is_unlocked = 1, unlocked_at = ? 
        WHERE id = ?
      `).run(nowStr, id)

      // Award achievement XP bonus
      db.prepare(`
        UPDATE dsa_game_profile 
        SET total_xp = total_xp + ?, updated_at = datetime('now') 
        WHERE id = 'primary_user'
      `).run(ach.xp_reward)

      // Persist unlock and updated profile to MongoDB Atlas
      persistAchievementUnlockToMongo(id, nowStr).catch(() => {})
      const updatedProfile = db.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')
      if (updatedProfile) {
        persistGameProfileToMongo(updatedProfile).catch(() => {})
      }

      unlocked.push({ ...ach, is_unlocked: 1, unlocked_at: nowStr })
    }
  }

  // Evaluate Milestones
  if (indSolves >= 1) unlockAchievement('first_solve')
  if (totalSolves >= 10) unlockAchievement('ten_solves')
  if (totalSolves >= 50) unlockAchievement('fifty_solves')
  if (totalSolves >= 100) unlockAchievement('hundred_solves')
  if (totalSolves >= 200) unlockAchievement('two_hundred_solves')
  if (hardSolves >= 5) unlockAchievement('hard_slayer')
  if (indSolves >= 25) unlockAchievement('pure_independence')
  if (durationSeconds > 0 && durationSeconds < 900 && indSolves >= 1) {
    unlockAchievement('speed_demon')
  }

  // Streaks
  if (streak >= 3) unlockAchievement('streak_3')
  if (streak >= 7) unlockAchievement('streak_7')
  if (streak >= 14) unlockAchievement('streak_14')
  if (streak >= 30) unlockAchievement('streak_30')

  // Topic Mastery
  if (bsSolves >= 5) unlockAchievement('binary_navigator')
  if (treeSolves >= 5) unlockAchievement('tree_architect')
  if (stringSolves >= 5) unlockAchievement('string_artisan')
  if (twoPointerSolves >= 5) unlockAchievement('two_pointer_adept')
  if (bitSolves >= 3) unlockAchievement('bit_manipulator')
  if (heapSolves >= 3) unlockAchievement('heap_harvester')
  if (trieSolves >= 3) unlockAchievement('trie_navigator')
  if (btSolves >= 3) unlockAchievement('backtracking_scout')
  if (graphSolves >= 3) unlockAchievement('graph_explorer')
  if (dpSolves >= 3) unlockAchievement('dp_milestone')
  if (solvedTopicsCount >= 6) unlockAchievement('polyglot_solver')

  // Revisions & Reflections
  if (completedRevisions >= 3) unlockAchievement('revision_champion')
  if (completedRevisions >= 10) unlockAchievement('revision_master')
  if (mistakeReflections >= 3) unlockAchievement('mistake_reflector')

  return unlocked
}

/**
 * Configure game penalties
 */
export function togglePenalties(enabled) {
  const val = enabled ? 1 : 0
  db.prepare(`UPDATE dsa_game_profile SET penalties_enabled = ?, updated_at = datetime('now') WHERE id = 'primary_user'`).run(val)
  const updatedProfile = db.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')
  if (updatedProfile) {
    persistGameProfileToMongo(updatedProfile).catch(() => {})
  }
  return { penalties_enabled: val }
}
