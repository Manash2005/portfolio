import { db } from '../db/database.js'

/**
 * Deterministically compute a problem's mastery level and score
 */
export function computeMastery(attempts, revisionItem) {
  if (!attempts || attempts.length === 0) {
    return {
      level: 'New',
      score: 0,
      explanation: 'Not attempted yet. Ready for first practice.',
    }
  }

  const solves = attempts.filter((a) => a.result === 'solved')
  const indSolves = solves.filter((a) => a.is_independent === 1)
  const asstSolves = solves.filter((a) => a.is_independent === 0 || a.solution_viewed === 1 || a.hints_used > 0)
  const failed = attempts.filter((a) => a.result === 'attempted_unsolved' || a.result === 'timed_out')

  const lastAttempt = attempts[0] // sorted by created_at DESC
  const lastSolve = solves[0]

  // Check if revision is overdue
  if (revisionItem && revisionItem.next_revision_due) {
    const today = new Date().toISOString().split('T')[0]
    if (revisionItem.next_revision_due <= today && solves.length > 0) {
      return {
        level: 'Needs Revision',
        score: 45,
        explanation: `Needs Revision — scheduled revision was due on ${revisionItem.next_revision_due}. Revisit to reinforce memory.`,
      }
    }
  }

  if (solves.length === 0) {
    return {
      level: 'Learning',
      score: 15,
      explanation: `${failed.length} attempt(s) made without a verified solve. Focus on understanding the core pattern.`,
    }
  }

  if (indSolves.length >= 3 && (lastSolve?.confidence_rating || 3) >= 4) {
    return {
      level: 'Strong',
      score: 95,
      explanation: `Strong mastery — solved independently ${indSolves.length} times with high confidence.`,
    }
  }

  if (indSolves.length >= 2) {
    return {
      level: 'Familiar',
      score: 75,
      explanation: `Familiar — solved independently ${indSolves.length} times. Practice periodically to maintain fluency.`,
    }
  }

  if (indSolves.length === 1) {
    return {
      level: 'Practicing',
      score: 55,
      explanation: 'Practicing — 1 independent solve completed. Reinforce with a spaced repetition review.',
    }
  }

  return {
    level: 'Learning',
    score: 35,
    explanation: `Learning — solved with hints or editorial (${asstSolves.length} assisted solve). Attempt independently next time.`,
  }
}

/**
 * Query problems with rich filters, search, and pagination
 */
export function getProblems({
  search = '',
  platform = 'all',
  difficulty = 'all',
  topic = 'all',
  pattern = 'all',
  is_free = 'all',
  status = 'all', // 'all', 'solved', 'unsolved', 'revision_due'
  mastery = 'all',
  sort = 'priority', // 'priority', 'difficulty', 'recent', 'least_recent', 'weakness'
  page = 1,
  limit = 20,
} = {}) {
  const conditions = []
  const params = []

  if (search.trim()) {
    conditions.push('(p.title LIKE ? OR p.primary_topic LIKE ? OR p.patterns LIKE ?)')
    const q = `%${search.trim()}%`
    params.push(q, q, q)
  }

  if (platform !== 'all') {
    conditions.push('p.platform = ?')
    params.push(platform.toLowerCase())
  }

  if (difficulty !== 'all') {
    conditions.push('p.difficulty = ?')
    params.push(difficulty)
  }

  if (topic !== 'all') {
    conditions.push('(p.primary_topic = ? OR p.secondary_topics LIKE ?)')
    params.push(topic, `%"${topic}"%`)
  }

  if (pattern !== 'all') {
    conditions.push('p.patterns LIKE ?')
    params.push(`%"${pattern}"%`)
  }

  if (is_free !== 'all') {
    conditions.push('p.is_free = ?')
    params.push(is_free === 'free' ? 1 : 0)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Fetch all matching problem rows with attempt stats
  const baseSql = `
    SELECT 
      p.*,
      COUNT(a.id) as attempts_count,
      SUM(CASE WHEN a.result = 'solved' THEN 1 ELSE 0 END) as solve_count,
      SUM(CASE WHEN a.result = 'solved' AND a.is_independent = 1 THEN 1 ELSE 0 END) as independent_solve_count,
      MAX(CASE WHEN a.result = 'solved' THEN a.created_at ELSE NULL END) as last_solved_at,
      MIN(CASE WHEN a.result = 'solved' AND a.duration_seconds IS NOT NULL THEN a.duration_seconds ELSE NULL END) as best_duration_seconds,
      r.next_revision_due,
      r.status as revision_status
    FROM dsa_problems p
    LEFT JOIN dsa_attempts a ON p.id = a.problem_id
    LEFT JOIN dsa_revision_schedule r ON p.id = r.problem_id
    ${whereClause}
    GROUP BY p.id
  `

  const allMatching = db.prepare(baseSql).all(...params)

  const today = new Date().toISOString().split('T')[0]

  // Enrich with calculated mastery and status filters
  const enriched = allMatching.map((p) => {
    // Parse secondary topics & patterns safely
    let secondaryTopics = []
    let patterns = []
    try {
      secondaryTopics = JSON.parse(p.secondary_topics || '[]')
    } catch (e) {}
    try {
      patterns = JSON.parse(p.patterns || '[]')
    } catch (e) {}

    const isSolved = (p.solve_count || 0) > 0
    const isRevisionDue = Boolean(p.next_revision_due && p.next_revision_due <= today && isSolved)

    // Compute deterministic mastery
    const masteryInfo = computeMastery(
      p.attempts_count > 0
        ? [
            {
              result: isSolved ? 'solved' : 'attempted_unsolved',
              is_independent: p.independent_solve_count > 0 ? 1 : 0,
              confidence_rating: 3,
            },
          ]
        : [],
      { next_revision_due: p.next_revision_due }
    )

    return {
      ...p,
      secondary_topics: secondaryTopics,
      patterns,
      is_solved: isSolved,
      is_independent_solve: (p.independent_solve_count || 0) > 0,
      is_revision_due: isRevisionDue,
      mastery_level: masteryInfo.level,
      mastery_score: masteryInfo.score,
      mastery_explanation: masteryInfo.explanation,
    }
  })

  // Apply post-aggregation filters
  let filtered = enriched
  if (status === 'solved') {
    filtered = filtered.filter((p) => p.is_solved)
  } else if (status === 'unsolved') {
    filtered = filtered.filter((p) => !p.is_solved)
  } else if (status === 'revision_due') {
    filtered = filtered.filter((p) => p.is_revision_due)
  }

  if (mastery !== 'all') {
    filtered = filtered.filter((p) => p.mastery_level.toLowerCase() === mastery.toLowerCase())
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'difficulty') {
      const diffOrder = { Easy: 1, Medium: 2, Hard: 3 }
      return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2)
    }
    if (sort === 'recent') {
      const aTime = a.last_solved_at || ''
      const bTime = b.last_solved_at || ''
      return bTime.localeCompare(aTime)
    }
    if (sort === 'least_recent') {
      if (!a.last_solved_at) return -1
      if (!b.last_solved_at) return 1
      return a.last_solved_at.localeCompare(b.last_solved_at)
    }
    if (sort === 'weakness') {
      return a.mastery_score - b.mastery_score
    }
    // Default 'priority': Revision Due > Weak mastery > Unattempted > Mastered
    if (a.is_revision_due !== b.is_revision_due) {
      return a.is_revision_due ? -1 : 1
    }
    return a.mastery_score - b.mastery_score
  })

  const total = filtered.length
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const totalPages = Math.ceil(total / pageSize) || 1
  const paginated = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize)

  return {
    problems: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  }
}

/**
 * Fetch a single problem with attempt history and mistake reflections
 */
export function getProblemById(id) {
  const problem = db.prepare('SELECT * FROM dsa_problems WHERE id = ? OR slug = ?').get(id, id)
  if (!problem) return null

  let secondaryTopics = []
  let patterns = []
  try {
    secondaryTopics = JSON.parse(problem.secondary_topics || '[]')
  } catch (e) {}
  try {
    patterns = JSON.parse(problem.patterns || '[]')
  } catch (e) {}

  const attempts = db
    .prepare('SELECT * FROM dsa_attempts WHERE problem_id = ? ORDER BY created_at DESC')
    .all(problem.id)

  const mistakes = db
    .prepare('SELECT * FROM dsa_mistake_journal WHERE problem_id = ? ORDER BY created_at DESC')
    .all(problem.id)

  const revisionSchedule = db
    .prepare('SELECT * FROM dsa_revision_schedule WHERE problem_id = ?')
    .get(problem.id)

  const mastery = computeMastery(attempts, revisionSchedule)

  return {
    ...problem,
    secondary_topics: secondaryTopics,
    patterns,
    attempts,
    mistakes,
    revision_schedule: revisionSchedule || null,
    mastery,
  }
}

/**
 * Safe catalog import from JSON or CSV
 * Does NOT overwrite or erase user's attempt history!
 */
export function importProblemCatalog(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Records must be a non-empty array of problem objects')
  }

  const insertOrUpdate = db.prepare(`
    INSERT INTO dsa_problems (
      id, platform, platform_problem_id, title, slug, canonical_url,
      difficulty, primary_topic, secondary_topics, patterns,
      is_free, access_status, estimated_solve_time, acceptance_rate, source
    ) VALUES (
      @id, @platform, @platform_problem_id, @title, @slug, @canonical_url,
      @difficulty, @primary_topic, @secondary_topics, @patterns,
      @is_free, @access_status, @estimated_solve_time, @acceptance_rate, @source
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      canonical_url = excluded.canonical_url,
      difficulty = excluded.difficulty,
      primary_topic = excluded.primary_topic,
      secondary_topics = excluded.secondary_topics,
      patterns = excluded.patterns,
      is_free = excluded.is_free,
      access_status = excluded.access_status,
      estimated_solve_time = excluded.estimated_solve_time,
      acceptance_rate = excluded.acceptance_rate,
      updated_at = datetime('now')
  `)

  let imported = 0
  let updated = 0
  let skipped = 0
  let invalid = 0

  const runImport = db.transaction((items) => {
    for (const item of items) {
      if (!item.title || !item.slug || !item.canonical_url || !item.difficulty || !item.primary_topic) {
        invalid++
        continue
      }

      const id = item.id || `custom-${item.slug}`
      const existing = db.prepare('SELECT id FROM dsa_problems WHERE id = ?').get(id)

      const payload = {
        id,
        platform: (item.platform || 'leetcode').toLowerCase(),
        platform_problem_id: item.platform_problem_id ? String(item.platform_problem_id) : null,
        title: item.title.trim(),
        slug: item.slug.trim(),
        canonical_url: item.canonical_url.trim(),
        difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium',
        primary_topic: item.primary_topic.trim(),
        secondary_topics: Array.isArray(item.secondary_topics)
          ? JSON.stringify(item.secondary_topics)
          : item.secondary_topics || '[]',
        patterns: Array.isArray(item.patterns) ? JSON.stringify(item.patterns) : item.patterns || '[]',
        is_free: item.is_free !== undefined ? (item.is_free ? 1 : 0) : 1,
        access_status: item.access_status || 'free',
        estimated_solve_time: parseInt(item.estimated_solve_time, 10) || 25,
        acceptance_rate: parseFloat(item.acceptance_rate) || null,
        source: item.source || 'user_import',
      }

      insertOrUpdate.run(payload)
      if (existing) {
        updated++
      } else {
        imported++
      }
    }
  })

  runImport(records)

  return {
    imported,
    updated,
    skipped,
    invalid,
    totalProcessed: records.length,
  }
}

/**
 * Get catalog summary statistics
 */
export function getCatalogStats() {
  const total = db.prepare('SELECT count(*) as c FROM dsa_problems').get().c
  const freeCount = db.prepare('SELECT count(*) as c FROM dsa_problems WHERE is_free = 1').get().c
  const platformCounts = db
    .prepare('SELECT platform, count(*) as count FROM dsa_problems GROUP BY platform')
    .all()
  const diffCounts = db
    .prepare('SELECT difficulty, count(*) as count FROM dsa_problems GROUP BY difficulty')
    .all()
  const topicCounts = db
    .prepare('SELECT primary_topic, count(*) as count FROM dsa_problems GROUP BY primary_topic ORDER BY count DESC')
    .all()

  return {
    total,
    freeCount,
    platformCounts,
    diffCounts,
    topicCounts,
  }
}
