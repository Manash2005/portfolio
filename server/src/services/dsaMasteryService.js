import { db } from '../db/database.js'
import { persistRevisionToMongo, persistEventToMongo } from '../db/mongoPersistence.js'

/**
 * Update or initialize spaced repetition schedule for a problem
 */
export function updateRevisionSchedule(problemId, { isSolved, isIndependent, confidence = 3 }) {
  const existing = db.prepare('SELECT * FROM dsa_revision_schedule WHERE problem_id = ?').get(problemId)
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  let intervalDays = 3
  let repetitionCount = 1
  let easeFactor = 2.5
  let status = 'upcoming'

  if (existing) {
    repetitionCount = existing.repetition_count + 1
    easeFactor = existing.ease_factor

    if (isSolved) {
      if (isIndependent) {
        // Successful independent solve increases interval exponentially (SuperMemo-2 style)
        if (repetitionCount === 2) {
          intervalDays = 7
        } else if (repetitionCount === 3) {
          intervalDays = 16
        } else {
          intervalDays = Math.round(existing.interval_days * easeFactor)
        }
        if (confidence >= 4) easeFactor = Math.min(3.0, easeFactor + 0.1)
      } else {
        // Assisted solve requires short-term revision to test independent recall
        intervalDays = 2
        repetitionCount = 1
      }
    } else {
      // Failed revision: reset interval to 1 day
      intervalDays = 1
      repetitionCount = 1
      easeFactor = Math.max(1.3, easeFactor - 0.2)
      status = 'due'
    }
  } else {
    // First schedule
    intervalDays = isIndependent && isSolved ? 3 : 1
  }

  // Calculate next revision date
  const nextDueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
  const nextDueDateStr = nextDueDate.toISOString().split('T')[0]

  db.prepare(`
    INSERT INTO dsa_revision_schedule (
      problem_id, last_solved_at, next_revision_due, interval_days, repetition_count, ease_factor, status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(problem_id) DO UPDATE SET
      last_solved_at = excluded.last_solved_at,
      next_revision_due = excluded.next_revision_due,
      interval_days = excluded.interval_days,
      repetition_count = excluded.repetition_count,
      ease_factor = excluded.ease_factor,
      status = excluded.status,
      updated_at = datetime('now')
  `).run(problemId, todayStr, nextDueDateStr, intervalDays, repetitionCount, easeFactor, status)

  const updatedRow = db.prepare('SELECT * FROM dsa_revision_schedule WHERE problem_id = ?').get(problemId)
  if (updatedRow) {
    persistRevisionToMongo(updatedRow).catch(() => {})
  }

  // Automatically schedule revision into site calendar
  try {
    syncRevisionToCalendar(problemId, nextDueDateStr, intervalDays)
  } catch (err) {
    console.warn('Calendar sync error in updateRevisionSchedule:', err)
  }

  return {
    problem_id: problemId,
    next_revision_due: nextDueDateStr,
    interval_days: intervalDays,
    repetition_count: repetitionCount,
  }
}

/**
 * Schedule a single spaced repetition problem into the site events calendar
 */
export function syncRevisionToCalendar(problemId, nextDueDateStr, intervalDays) {
  try {
    const problem = db.prepare('SELECT id, title, difficulty, primary_topic, platform, canonical_url FROM dsa_problems WHERE id = ?').get(problemId)
    if (!problem || !nextDueDateStr) return null

    const eventId = `rev_${problemId}`
    const startAt = `${nextDueDateStr}T09:00:00`
    const endAt = `${nextDueDateStr}T10:00:00`
    const title = `DSA Revision: ${problem.title}`
    const description = `Scheduled spaced repetition review for ${problem.title} (${problem.difficulty} • ${problem.primary_topic}). Reinforce memory retention.`
    const color = problem.difficulty === 'Easy' ? '#B8FF3C' : problem.difficulty === 'Medium' ? '#FFD13B' : '#FF4D4D'
    const tagsJson = JSON.stringify(['DSA', 'Revision', problem.difficulty, problem.primary_topic])

    db.prepare(`
      INSERT INTO events (
        id, title, description, category, start_at, end_at, all_day, timezone,
        status, visibility, show_on_portfolio_heatmap, color, tags, priority, external_url
      ) VALUES (
        ?, ?, ?, 'Competitive Programming', ?, ?, 1, 'Asia/Kolkata',
        'Planned', 'Private', 1, ?, ?, 'high', ?
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        start_at = excluded.start_at,
        end_at = excluded.end_at,
        color = excluded.color,
        tags = excluded.tags,
        external_url = excluded.external_url,
        status = 'Planned',
        updated_at = datetime('now')
    `).run(eventId, title, description, startAt, endAt, color, tagsJson, problem.canonical_url)

    const updatedEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId)
    if (updatedEvent) {
      persistEventToMongo(updatedEvent).catch(() => {})
    }

    return updatedEvent
  } catch (err) {
    console.warn(`Failed to sync revision event for problem ${problemId}:`, err)
    return null
  }
}

/**
 * Bulk sync all active spaced repetition items into site calendar events
 */
export function syncAllRevisionsToCalendar() {
  const revisions = db.prepare(`
    SELECT r.problem_id, r.next_revision_due, r.interval_days
    FROM dsa_revision_schedule r
    WHERE r.next_revision_due IS NOT NULL AND r.next_revision_due != ''
  `).all()

  let count = 0
  for (const rev of revisions) {
    const res = syncRevisionToCalendar(rev.problem_id, rev.next_revision_due, rev.interval_days)
    if (res) count++
  }
  return count
}

/**
 * Get the Spaced Repetition queue categorized by urgency
 */
export function getRevisionQueue() {
  const today = new Date().toISOString().split('T')[0]

  const items = db.prepare(`
    SELECT 
      r.*,
      p.title,
      p.platform,
      p.canonical_url,
      p.difficulty,
      p.primary_topic,
      p.patterns,
      (SELECT COUNT(*) FROM dsa_attempts a WHERE a.problem_id = p.id AND a.result = 'solved') as total_solves
    FROM dsa_revision_schedule r
    JOIN dsa_problems p ON r.problem_id = p.id
    ORDER BY r.next_revision_due ASC
  `).all()

  const overdue = []
  const dueToday = []
  const upcoming = []

  for (const item of items) {
    let patterns = []
    try {
      patterns = JSON.parse(item.patterns || '[]')
    } catch (e) {}
    const enriched = { ...item, patterns }

    if (item.next_revision_due < today) {
      overdue.push(enriched)
    } else if (item.next_revision_due === today) {
      dueToday.push(enriched)
    } else {
      upcoming.push(enriched)
    }
  }

  return {
    overdue,
    dueToday,
    upcoming: upcoming.slice(0, 30),
    totalDueCount: overdue.length + dueToday.length,
    totalScheduledCount: items.length,
  }
}


/**
 * Calculate topic mastery statistics across all topics
 */
export function getTopicMasteryStats() {
  const today = new Date().toISOString().split('T')[0]

  const topics = db.prepare(`
    SELECT DISTINCT primary_topic FROM dsa_problems ORDER BY primary_topic ASC
  `).all().map(r => r.primary_topic)

  const result = []

  for (const topic of topics) {
    const problems = db.prepare(`
      SELECT 
        p.id,
        p.difficulty,
        p.is_free,
        COUNT(a.id) as attempts_count,
        SUM(CASE WHEN a.result = 'solved' THEN 1 ELSE 0 END) as solve_count,
        SUM(CASE WHEN a.result = 'solved' AND a.is_independent = 1 THEN 1 ELSE 0 END) as ind_solve_count,
        AVG(CASE WHEN a.result = 'solved' AND a.duration_seconds IS NOT NULL THEN a.duration_seconds ELSE NULL END) as avg_duration,
        r.next_revision_due
      FROM dsa_problems p
      LEFT JOIN dsa_attempts a ON p.id = a.problem_id
      LEFT JOIN dsa_revision_schedule r ON p.id = r.problem_id
      WHERE p.primary_topic = ?
      GROUP BY p.id
    `).all(topic)

    const total = problems.length
    const freeCount = problems.filter(p => p.is_free === 1).length
    const attempted = problems.filter(p => p.attempts_count > 0).length
    const solved = problems.filter(p => p.solve_count > 0).length
    const independentlySolved = problems.filter(p => p.ind_solve_count > 0).length
    const needsRevision = problems.filter(p => p.next_revision_due && p.next_revision_due <= today && p.solve_count > 0).length

    // Duration calculation
    const durations = problems.filter(p => p.avg_duration != null).map(p => p.avg_duration)
    const avgDurationSeconds = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null

    // Deterministic topic mastery score
    // 60% weight on independently solved ratio, 20% on coverage, 20% penalty for overdue revisions
    let score = 0
    if (total > 0) {
      const indSolveRatio = independentlySolved / total
      const attemptedRatio = attempted / total
      const revisionPenalty = needsRevision > 0 ? (needsRevision / total) * 0.2 : 0
      score = Math.max(0, Math.min(100, Math.round((indSolveRatio * 0.6 + attemptedRatio * 0.2 - revisionPenalty + (solved / total) * 0.2) * 100)))
    }

    let status = 'Needs Focus'
    if (score >= 70) status = 'Mastered'
    else if (score >= 40) status = 'Progressing'

    result.push({
      topic,
      total,
      freeCount,
      attempted,
      solved,
      independentlySolved,
      needsRevision,
      avgDurationSeconds,
      masteryScore: score,
      status,
    })
  }

  // Sort: lowest mastery score first (weakest topics at top)
  const weakTopics = result.filter(t => t.masteryScore < 50 || t.needsRevision > 0)

  return {
    topics: result,
    weakTopics,
  }
}

/**
 * Deterministic Practice Prioritization Engine (Fallback when LLM is unavailable)
 */
export function getDeterministicPracticePlan(durationBudgetMinutes = 45) {
  const revisionData = getRevisionQueue()
  const topicData = getTopicMasteryStats()
  const today = new Date().toISOString().split('T')[0]

  const planItems = []
  let accumulatedMinutes = 0

  // 1. First priority: Overdue or due-today revision problem
  if (revisionData.totalDueCount > 0) {
    const revItem = revisionData.overdue[0] || revisionData.dueToday[0]
    const estTime = revItem.estimated_solve_time || 20
    planItems.push({
      problem_id: revItem.problem_id,
      title: revItem.title,
      platform: revItem.platform,
      difficulty: revItem.difficulty,
      primary_topic: revItem.primary_topic,
      canonical_url: revItem.canonical_url,
      activity_type: 'revision',
      reason: `Spaced revision due: last solved on ${revItem.last_solved_at}. Reinforce memory now.`,
      priority: 'high',
      estimated_minutes: estTime,
    })
    accumulatedMinutes += estTime
  }

  // 2. Second priority: Problem from the weakest topic
  const weakestTopic = topicData.weakTopics[0] || topicData.topics[0]
  if (weakestTopic) {
    // Find an unattempted or previously failed problem in this topic
    const candidate = db.prepare(`
      SELECT p.* 
      FROM dsa_problems p
      LEFT JOIN dsa_attempts a ON p.id = a.problem_id
      WHERE p.primary_topic = ? 
        AND p.id NOT IN (${planItems.map(() => '?').join(',') || "''"})
      GROUP BY p.id
      ORDER BY 
        SUM(CASE WHEN a.result = 'solved' THEN 1 ELSE 0 END) ASC,
        p.estimated_solve_time ASC
      LIMIT 1
    `).get(weakestTopic.topic, ...planItems.map(p => p.problem_id))

    if (candidate) {
      const estTime = candidate.estimated_solve_time || 25
      planItems.push({
        problem_id: candidate.id,
        title: candidate.title,
        platform: candidate.platform,
        difficulty: candidate.difficulty,
        primary_topic: candidate.primary_topic,
        canonical_url: candidate.canonical_url,
        activity_type: 'weak_topic_practice',
        reason: `Weak topic focus: ${weakestTopic.topic} has ${weakestTopic.masteryScore}% mastery score.`,
        priority: 'high',
        estimated_minutes: estTime,
      })
      accumulatedMinutes += estTime
    }
  }

  // 3. Third priority: Challenge problem or new topic problem if budget permits
  if (accumulatedMinutes < durationBudgetMinutes) {
    const remainingTime = durationBudgetMinutes - accumulatedMinutes
    const targetDiff = remainingTime >= 30 ? 'Medium' : 'Easy'

    const candidate = db.prepare(`
      SELECT p.* 
      FROM dsa_problems p
      LEFT JOIN dsa_attempts a ON p.id = a.problem_id
      WHERE p.difficulty = ?
        AND p.id NOT IN (${planItems.map(() => '?').join(',') || "''"})
        AND p.is_free = 1
      GROUP BY p.id
      HAVING COUNT(a.id) = 0
      ORDER BY p.estimated_solve_time ASC
      LIMIT 1
    `).get(targetDiff, ...planItems.map(p => p.problem_id))

    if (candidate) {
      const estTime = candidate.estimated_solve_time || 20
      planItems.push({
        problem_id: candidate.id,
        title: candidate.title,
        platform: candidate.platform,
        difficulty: candidate.difficulty,
        primary_topic: candidate.primary_topic,
        canonical_url: candidate.canonical_url,
        activity_type: 'new_problem',
        reason: `New challenge: Explore ${candidate.primary_topic} with an unattempted ${candidate.difficulty} problem.`,
        priority: 'medium',
        estimated_minutes: estTime,
      })
      accumulatedMinutes += estTime
    }
  }

  return {
    plan_date: today,
    duration_budget_minutes: durationBudgetMinutes,
    estimated_total_minutes: accumulatedMinutes,
    summary: `Structured ${accumulatedMinutes}-minute session focusing on ${planItems.map(i => i.primary_topic).join(' & ')}.`,
    generated_by: 'deterministic',
    items: planItems,
  }
}
