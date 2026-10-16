import { db } from '../db/database.js'
import crypto from 'node:crypto'
import { recordActivityReward } from './dsaGamificationService.js'
import { updateRevisionSchedule } from './dsaMasteryService.js'
import { logMistake } from './dsaMistakeService.js'
import {
  persistAttemptToMongo,
  persistRevisionToMongo,
  persistGameProfileToMongo,
  persistEventToMongo,
} from '../db/mongoPersistence.js'

export function recordAttempt({
  problem_id,
  started_at = null,
  ended_at = null,
  duration_seconds = null,
  result = 'solved', // 'solved', 'attempted_unsolved', 'timed_out', 'abandoned', 'reviewed'
  is_independent = 1,
  hints_used = 0,
  solution_viewed = 0,
  language = 'Java',
  confidence_rating = 3,
  difficulty_experienced = 'medium',
  notes = '',
  mistakes = [],
  source = 'practice_arena',
  linkToCalendar = false,
}) {
  const problem = db.prepare('SELECT * FROM dsa_problems WHERE id = ?').get(problem_id)
  if (!problem) {
    throw new Error(`Problem not found: ${problem_id}`)
  }

  // Enforce honesty: if solution was viewed or hints > 0, cannot be independent solve
  const actualIndependent = solution_viewed === 1 || hints_used > 0 ? 0 : is_independent ? 1 : 0

  // Calculate attempt number
  const prevAttemptsCount = db
    .prepare('SELECT count(*) as count FROM dsa_attempts WHERE problem_id = ?')
    .get(problem_id).count
  const attemptNumber = prevAttemptsCount + 1

  // Check if problem was currently due for revision
  const todayStr = new Date().toISOString().split('T')[0]
  const revSchedule = db.prepare('SELECT * FROM dsa_revision_schedule WHERE problem_id = ?').get(problem_id)
  const isRevisionSolve = Boolean(revSchedule && revSchedule.next_revision_due <= todayStr && result === 'solved')

  // Target solve times based on difficulty
  const targetMinutes = problem.estimated_solve_time || (
    problem.difficulty === 'Easy' ? 15 : problem.difficulty === 'Medium' ? 30 : 45
  )
  const durationMinutes = duration_seconds ? Math.floor(duration_seconds / 60) : 0
  const durationSecondsTotal = duration_seconds || 0

  // Calculate XP with Intelligent Penalties
  let xp = 0
  const xpBreakdown = []

  if (result === 'solved') {
    // 1. Base solve points scaled by difficulty
    const baseSolveXp = problem.difficulty === 'Easy' ? 50 : problem.difficulty === 'Medium' ? 65 : 80
    xp += baseSolveXp
    xpBreakdown.push({ label: `${problem.difficulty} Base Solve`, xp: baseSolveXp, type: 'bonus' })

    // 2. Independent solve bonus vs Assistance Penalties
    if (actualIndependent === 1) {
      xp += 30
      xpBreakdown.push({ label: 'Independent Solve Bonus', xp: 30, type: 'bonus' })
    } else {
      if (solution_viewed === 1) {
        xp -= 15
        xpBreakdown.push({ label: 'Solution Viewed Penalty', xp: -15, type: 'penalty' })
      }
      if (hints_used > 0) {
        const hintPenalty = hints_used * 5
        xp -= hintPenalty
        xpBreakdown.push({ label: `Hint Usage Penalty (${hints_used} hint${hints_used > 1 ? 's' : ''})`, xp: -hintPenalty, type: 'penalty' })
      }
    }

    // 3. Spaced revision bonus
    if (isRevisionSolve) {
      xp += 25
      xpBreakdown.push({ label: 'Spaced Repetition Review Bonus', xp: 25, type: 'bonus' })
    }

    // 4. Overtime Penalty vs Fast Speed Bonus
    if (durationMinutes > targetMinutes) {
      const extraMinutes = durationMinutes - targetMinutes
      // Overtime penalty scale per extra minute based on difficulty:
      // Easy: -10 XP/min (max -40 XP)
      // Medium: -7 XP/min (max -35 XP)
      // Hard: -5 XP/min (max -30 XP)
      const perMinRate = problem.difficulty === 'Easy' ? 10 : problem.difficulty === 'Medium' ? 7 : 5
      const maxCap = problem.difficulty === 'Easy' ? 40 : problem.difficulty === 'Medium' ? 35 : 30
      const overtimePenalty = Math.min(maxCap, extraMinutes * perMinRate)
      xp -= overtimePenalty
      xpBreakdown.push({
        label: `Overtime Penalty (${extraMinutes}m over ${targetMinutes}m target at -${perMinRate} XP/m)`,
        xp: -overtimePenalty,
        type: 'penalty',
      })
    } else if (durationSecondsTotal > 0 && durationSecondsTotal < targetMinutes * 60) {
      xp += 20
      xpBreakdown.push({ label: `Fast Execution Speed Bonus (<${targetMinutes}m)`, xp: 20, type: 'bonus' })
    }

    // 5. Completion Floor Protection: guaranteed positive reward for finishing
    const minFloor = problem.difficulty === 'Easy' ? 15 : problem.difficulty === 'Medium' ? 20 : 25
    if (xp < minFloor) {
      const floorBoost = minFloor - xp
      xpBreakdown.push({ label: 'Completion Floor Protection', xp: floorBoost, type: 'bonus' })
      xp = minFloor
    }
  } else if (result === 'attempted_unsolved') {
    if (durationSecondsTotal >= 180) {
      xp = 10
      xpBreakdown.push({ label: 'Genuine Effort Reward (>3m attempt)', xp: 10, type: 'bonus' })
    } else {
      xp = 0
      xpBreakdown.push({ label: 'Rapid Abandonment Penalty (<3m attempt)', xp: 0, type: 'penalty' })
    }
  }

  // 6. Mistake Journal Reflection Bonus
  if (Array.isArray(mistakes) && mistakes.length > 0) {
    xp += 15
    xpBreakdown.push({ label: 'Mistake Journal Reflection Bonus', xp: 15, type: 'bonus' })
  }

  const attemptId = crypto.randomUUID()
  let calendarEventId = null

  // Run everything inside an atomic transaction
  const executeAttempt = db.transaction(() => {
    // 1. Link to Second Brain Calendar if requested
    if (linkToCalendar) {
      try {
        const eventId = crypto.randomUUID()
        const now = new Date().toISOString()
        const eventTitle = `DSA: ${problem.title} (${result === 'solved' ? 'Solved' : 'Attempted'})`
        const eventDesc = `Practiced ${problem.difficulty} problem on ${problem.platform}. Duration: ${Math.round((duration_seconds || 0) / 60)}m. XP: +${xp}.`
        
        db.prepare(`
          INSERT INTO events (id, title, description, start_at, end_at, category, status, visibility, show_on_portfolio_heatmap, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Learning', 'Completed', 'Private', 1, ?, ?)
        `).run(eventId, eventTitle, eventDesc, started_at || now, ended_at || now, now, now)
        calendarEventId = eventId
      } catch (err) {
        console.warn('Could not link DSA attempt to calendar event:', err)
        calendarEventId = null
      }
    }

    // 2. Insert attempt
    const attemptCreatedAt = new Date().toISOString()
    db.prepare(`
      INSERT INTO dsa_attempts (
        id, problem_id, attempt_number, started_at, ended_at, duration_seconds,
        result, is_independent, hints_used, solution_viewed, language,
        confidence_rating, difficulty_experienced, notes, source, xp_awarded,
        calendar_event_id, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      attemptId,
      problem_id,
      attemptNumber,
      started_at,
      ended_at,
      duration_seconds,
      result,
      actualIndependent,
      hints_used,
      solution_viewed,
      language,
      confidence_rating,
      difficulty_experienced,
      notes,
      source,
      xp,
      calendarEventId,
      attemptCreatedAt
    )

    // 3. Log mistakes if provided
    if (Array.isArray(mistakes)) {
      for (const m of mistakes) {
        if (m.category && m.mistake_description) {
          logMistake({
            problem_id,
            attempt_id: attemptId,
            category: m.category,
            mistake_description: m.mistake_description,
            lesson_learned: m.lesson_learned,
          })
        }
      }
    }

    // 4. Update Spaced Repetition Schedule
    const revUpdate = updateRevisionSchedule(problem_id, {
      isSolved: result === 'solved',
      isIndependent: actualIndependent === 1,
      confidence: confidence_rating,
    })

    // 5. Award XP, update streak and achievements
    const rewardInfo = recordActivityReward({
      xpEarned: xp,
      durationSeconds: duration_seconds || 0,
      isRevision: isRevisionSolve,
    })

    return {
      attemptId,
      attemptNumber,
      xpAwarded: xp,
      isRevisionSolve,
      revisionUpdate: revUpdate,
      rewardInfo,
      xpBreakdown,
    }
  })

  const txResult = executeAttempt()

  const savedAttempt = db.prepare('SELECT * FROM dsa_attempts WHERE id = ?').get(attemptId)

  // Persist permanently to MongoDB Atlas so Render rebuilds never wipe progress
  if (savedAttempt) {
    persistAttemptToMongo(savedAttempt).catch(() => {})
  }
  if (calendarEventId) {
    const calEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(calendarEventId)
    if (calEvent) persistEventToMongo(calEvent).catch(() => {})
  }
  const revScheduleRow = db.prepare('SELECT * FROM dsa_revision_schedule WHERE problem_id = ?').get(problem_id)
  if (revScheduleRow) {
    persistRevisionToMongo(revScheduleRow).catch(() => {})
  }
  const gameProfileRow = db.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')
  if (gameProfileRow) {
    persistGameProfileToMongo(gameProfileRow).catch(() => {})
  }

  return {
    success: true,
    attempt: savedAttempt,
    problem: {
      id: problem.id,
      title: problem.title,
      canonical_url: problem.canonical_url,
      difficulty: problem.difficulty,
      primary_topic: problem.primary_topic,
    },
    xpEarned: txResult.xpAwarded,
    rewardInfo: txResult.rewardInfo,
    revisionUpdate: txResult.revisionUpdate,
    xpBreakdown: txResult.xpBreakdown,
  }
}

/**
 * Get recent attempt history
 */
export function getRecentAttempts({ limit = 20 } = {}) {
  return db
    .prepare(`
      SELECT 
        a.*, 
        p.title as problem_title, 
        p.platform, 
        p.difficulty, 
        p.primary_topic, 
        p.canonical_url,
        r.next_revision_due,
        r.interval_days as revision_interval_days,
        r.repetition_count as revision_repetition_count
      FROM dsa_attempts a
      JOIN dsa_problems p ON a.problem_id = p.id
      LEFT JOIN dsa_revision_schedule r ON a.problem_id = r.problem_id
      ORDER BY a.created_at DESC
      LIMIT ?
    `)
    .all(limit)
}

