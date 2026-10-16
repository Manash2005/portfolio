import {
  getProblems,
  getProblemById,
  importProblemCatalog,
  getCatalogStats,
} from '../services/dsaCatalogService.js'
import {
  getGameProfile,
  togglePenalties,
} from '../services/dsaGamificationService.js'
import {
  recordAttempt,
  getRecentAttempts,
} from '../services/dsaAttemptService.js'
import {
  getTopicMasteryStats,
  getRevisionQueue,
  getDeterministicPracticePlan,
  syncAllRevisionsToCalendar,
} from '../services/dsaMasteryService.js'
import {
  logMistake,
  getMistakes,
  getMistakeAnalytics,
} from '../services/dsaMistakeService.js'
import {
  generatePracticePlan,
  analyzeWeaknesses,
} from '../services/dsaAiCoachService.js'
import { syncLeetCodeRecentSubmissions } from '../services/dsaSyncService.js'
import { db } from '../db/database.js'
import { persistProblemToMongo } from '../db/mongoPersistence.js'

/**
 * GET /api/v1/dsa/overview
 * Combined overview for the DSA Arena dashboard
 */
export async function getDsaOverview(req, res) {
  try {
    const profile = getGameProfile()
    const revisionData = getRevisionQueue()
    const catalogStats = getCatalogStats()
    const topicStats = getTopicMasteryStats()
    const recentAttempts = getRecentAttempts({ limit: 15 })

    // Active daily plan for today
    const today = new Date().toISOString().split('T')[0]
    const planRow = db
      .prepare('SELECT * FROM dsa_daily_plans WHERE plan_date = ? ORDER BY created_at DESC LIMIT 1')
      .get(today)

    let activePlan = null
    if (planRow) {
      try {
        activePlan = {
          ...planRow,
          items: JSON.parse(planRow.items_json || '[]'),
        }
      } catch (e) {
        activePlan = planRow
      }
    }

    // Analytics summary
    const totalSolvesRow = db
      .prepare("SELECT count(DISTINCT problem_id) as count FROM dsa_attempts WHERE result = 'solved'")
      .get()
    const indSolvesRow = db
      .prepare("SELECT count(DISTINCT problem_id) as count FROM dsa_attempts WHERE result = 'solved' AND is_independent = 1")
      .get()
    const asstSolvesRow = db
      .prepare("SELECT count(DISTINCT problem_id) as count FROM dsa_attempts WHERE result = 'solved' AND (is_independent = 0 OR solution_viewed = 1 OR hints_used > 0)")
      .get()
    const totalAttemptsRow = db.prepare('SELECT count(*) as count FROM dsa_attempts').get()

    // 1. Difficulty distribution chart data
    const diffBreakdown = db.prepare(`
      SELECT 
        p.difficulty,
        count(DISTINCT p.id) as catalog_count,
        count(DISTINCT CASE WHEN a.result = 'solved' THEN p.id ELSE NULL END) as solved_count
      FROM dsa_problems p
      LEFT JOIN dsa_attempts a ON p.id = a.problem_id
      GROUP BY p.difficulty
    `).all()

    const diffStats = {
      Easy: { solved: 0, total: 0 },
      Medium: { solved: 0, total: 0 },
      Hard: { solved: 0, total: 0 },
    }
    diffBreakdown.forEach((d) => {
      if (diffStats[d.difficulty]) {
        diffStats[d.difficulty] = { solved: d.solved_count, total: d.catalog_count }
      }
    })

    // 2. Weekly 7-day activity trend chart data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayName = dayNames[d.getDay()]

      const dayStats = db.prepare(`
        SELECT 
          count(DISTINCT problem_id) as solves,
          sum(coalesce(duration_seconds, 0)) as total_duration,
          sum(coalesce(xp_awarded, 0)) as total_xp
        FROM dsa_attempts
        WHERE date(created_at) = ? AND result = 'solved'
      `).get(dateStr)

      weeklyActivity.push({
        date: dateStr,
        day: dayName,
        solves: dayStats ? dayStats.solves : 0,
        minutes: dayStats ? Math.round((dayStats.total_duration || 0) / 60) : 0,
        xp: dayStats ? dayStats.total_xp || 0 : 0,
        isToday: i === 0,
      })
    }

    // 3. Solve Types breakdown
    const totalSolved = totalSolvesRow ? totalSolvesRow.count : 0
    const indSolved = indSolvesRow ? indSolvesRow.count : 0
    const asstSolved = asstSolvesRow ? asstSolvesRow.count : 0
    const solveTypes = {
      independent: indSolved,
      assisted: asstSolved,
      independentPercentage: totalSolved > 0 ? Math.round((indSolved / totalSolved) * 100) : 100,
    }

    // 4. Topic mastery chart sample (Top 8 topics)
    const topicCharts = topicStats.topics.slice(0, 8).map((t) => ({
      topic: t.topic,
      solved: t.solved,
      total: t.total,
      score: t.masteryScore,
      percentage: t.total > 0 ? Math.round((t.solved / t.total) * 100) : 0,
    }))

    // 5. Solve Times by Difficulty Trend (Line graph: Y = time in minutes, X = dates, 3 lines: Easy, Medium, Hard)
    const solveTimeRows = db.prepare(`
      SELECT 
        date(a.created_at) as date,
        p.difficulty,
        ROUND(AVG(a.duration_seconds) / 60.0, 1) as avg_minutes,
        ROUND(AVG(a.duration_seconds)) as avg_seconds,
        COUNT(a.id) as solve_count
      FROM dsa_attempts a
      JOIN dsa_problems p ON a.problem_id = p.id
      WHERE a.result = 'solved' AND a.duration_seconds > 0
      GROUP BY date(a.created_at), p.difficulty
      ORDER BY date(a.created_at) ASC
    `).all()

    const solveTimeMap = {}
    solveTimeRows.forEach(r => {
      if (!solveTimeMap[r.date]) {
        solveTimeMap[r.date] = {
          date: r.date,
          Easy: null,
          Medium: null,
          Hard: null,
          details: {
            Easy: { avgMinutes: null, solveCount: 0 },
            Medium: { avgMinutes: null, solveCount: 0 },
            Hard: { avgMinutes: null, solveCount: 0 },
          }
        }
      }
      solveTimeMap[r.date][r.difficulty] = r.avg_minutes
      solveTimeMap[r.date].details[r.difficulty] = {
        avgMinutes: r.avg_minutes,
        avgSeconds: r.avg_seconds,
        solveCount: r.solve_count,
      }
    })

    const solveTimesTrend = Object.values(solveTimeMap).sort((a, b) => a.date.localeCompare(b.date))

    // Overall stats by difficulty
    const overallDiffTimes = db.prepare(`
      SELECT 
        p.difficulty,
        ROUND(AVG(a.duration_seconds) / 60.0, 1) as avg_minutes,
        ROUND(MIN(a.duration_seconds) / 60.0, 1) as min_minutes,
        ROUND(MAX(a.duration_seconds) / 60.0, 1) as max_minutes,
        COUNT(a.id) as total_solved
      FROM dsa_attempts a
      JOIN dsa_problems p ON a.problem_id = p.id
      WHERE a.result = 'solved' AND a.duration_seconds > 0
      GROUP BY p.difficulty
    `).all()

    const overallAverages = {
      Easy: { avgMinutes: null, minMinutes: null, maxMinutes: null, totalSolved: 0, targetMinutes: 15 },
      Medium: { avgMinutes: null, minMinutes: null, maxMinutes: null, totalSolved: 0, targetMinutes: 30 },
      Hard: { avgMinutes: null, minMinutes: null, maxMinutes: null, totalSolved: 0, targetMinutes: 45 },
    }

    overallDiffTimes.forEach(row => {
      if (overallAverages[row.difficulty]) {
        overallAverages[row.difficulty] = {
          avgMinutes: row.avg_minutes,
          minMinutes: row.min_minutes,
          maxMinutes: row.max_minutes,
          totalSolved: row.total_solved,
          targetMinutes: row.difficulty === 'Easy' ? 15 : row.difficulty === 'Medium' ? 30 : 45,
        }
      }
    })

    // Accuracy and time metrics
    const totalAttemptsCount = totalAttemptsRow ? totalAttemptsRow.count : 0
    const accuracyRate = totalAttemptsCount > 0 ? Math.round((totalSolved / totalAttemptsCount) * 100) : 100
    const totalPracticeSecs = db.prepare(`SELECT COALESCE(SUM(duration_seconds), 0) as s FROM dsa_attempts`).get().s
    const totalPracticeMinutes = Math.round(totalPracticeSecs / 60)

    // Target adherence rate
    const solvesWithTarget = db.prepare(`
      SELECT 
        a.duration_seconds,
        coalesce(p.estimated_solve_time, case when p.difficulty = 'Easy' then 15 when p.difficulty = 'Medium' then 30 else 45 end) * 60 as target_seconds
      FROM dsa_attempts a
      JOIN dsa_problems p ON a.problem_id = p.id
      WHERE a.result = 'solved' AND a.duration_seconds > 0
    `).all()

    const withinTargetCount = solvesWithTarget.filter(s => s.duration_seconds <= s.target_seconds).length
    const speedAdherenceRate = solvesWithTarget.length > 0 ? Math.round((withinTargetCount / solvesWithTarget.length) * 100) : 100

    return res.status(200).json({
      success: true,
      profile,
      stats: {
        totalProblems: catalogStats.total,
        uniqueSolved: totalSolved,
        independentSolves: indSolved,
        assistedSolves: asstSolved,
        totalAttempts: totalAttemptsCount,
        accuracyRate,
        totalPracticeMinutes,
        speedAdherenceRate,
        dueRevisionsCount: revisionData.totalDueCount,
        totalScheduledRevisions:
          revisionData.totalScheduledCount ||
          (revisionData.overdue.length + revisionData.dueToday.length + revisionData.upcoming.length),
      },
      charts: {
        difficulty: diffStats,
        weeklyActivity,
        solveTypes,
        topicCharts,
        solveTimesByDifficulty: {
          trend: solveTimesTrend,
          averages: overallAverages,
          speedAdherenceRate,
        },
      },
      activePlan,
      weakTopics: topicStats.weakTopics.slice(0, 3),
      recentAttempts,
    })
  } catch (err) {
    console.error('getDsaOverview error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * GET /api/v1/dsa/problems
 * Query question bank with filters
 */
export async function listProblems(req, res) {
  try {
    const result = getProblems(req.query)
    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (err) {
    console.error('listProblems error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * GET /api/v1/dsa/problems/:id
 */
export async function getProblem(req, res) {
  try {
    const problem = getProblemById(req.params.id)
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' })
    }
    return res.status(200).json({ success: true, problem })
  } catch (err) {
    console.error('getProblem error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/attempts
 * Record a timed practice session attempt
 */
export async function createAttempt(req, res) {
  try {
    const {
      problem_id,
      started_at,
      ended_at,
      duration_seconds,
      result,
      is_independent,
      hints_used,
      solution_viewed,
      language,
      confidence_rating,
      difficulty_experienced,
      notes,
      mistakes,
      linkToCalendar,
    } = req.body

    const targetProblemId = req.body.problem_id || req.body.id
    if (!targetProblemId) {
      return res.status(400).json({ success: false, error: 'problem_id is required' })
    }

    const attemptResult = recordAttempt({
      problem_id: targetProblemId,
      started_at,
      ended_at,
      duration_seconds: duration_seconds != null ? parseInt(duration_seconds, 10) : null,
      result: result || 'solved',
      is_independent: is_independent === undefined ? 1 : is_independent ? 1 : 0,
      hints_used: parseInt(hints_used, 10) || 0,
      solution_viewed: solution_viewed ? 1 : 0,
      language: language || 'Java',
      confidence_rating: parseInt(confidence_rating, 10) || 3,
      difficulty_experienced: difficulty_experienced || 'medium',
      notes: notes || '',
      mistakes: Array.isArray(mistakes) ? mistakes : [],
      source: 'practice_arena',
      linkToCalendar: Boolean(linkToCalendar),
    })

    return res.status(201).json({
      success: true,
      ...attemptResult,
    })
  } catch (err) {
    console.error('createAttempt error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * GET /api/v1/dsa/topics
 * Get topic mastery breakdown
 */
export async function getTopicMastery(req, res) {
  try {
    const data = getTopicMasteryStats()
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    console.error('getTopicMastery error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * GET /api/v1/dsa/revision
 * Get spaced repetition queue
 */
export async function getRevisionList(req, res) {
  try {
    const queue = getRevisionQueue()
    try {
      syncAllRevisionsToCalendar()
    } catch {}
    return res.status(200).json({ success: true, queue })
  } catch (err) {
    console.error('getRevisionList error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/revision/sync-calendar
 * Manually trigger sync of all spaced repetition items to site calendar
 */
export async function syncRevisionsCalendarController(req, res) {
  try {
    const syncedCount = syncAllRevisionsToCalendar()
    return res.status(200).json({
      success: true,
      syncedCount,
      message: `Successfully synchronized ${syncedCount} revision date${syncedCount === 1 ? '' : 's'} to your site calendar.`,
    })
  } catch (err) {
    console.error('syncRevisionsCalendarController error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/mistakes
 * Add mistake journal entry
 */
export async function createMistake(req, res) {
  try {
    const entry = logMistake(req.body)
    return res.status(201).json({ success: true, mistake: entry })
  } catch (err) {
    console.error('createMistake error:', err)
    return res.status(400).json({ success: false, error: err.message })
  }
}

/**
 * GET /api/v1/dsa/mistakes
 * Get mistake journal entries and analytics
 */
export async function listMistakes(req, res) {
  try {
    const mistakes = getMistakes(req.query)
    const analytics = getMistakeAnalytics()
    return res.status(200).json({ success: true, mistakes, analytics })
  } catch (err) {
    console.error('listMistakes error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/ai/practice-plan
 * On-demand AI practice plan generation (Groq/OpenRouter with deterministic fallback)
 */
export async function generateAiPracticePlan(req, res) {
  try {
    const duration = parseInt(req.body.duration_budget_minutes, 10) || 45
    const plan = await generatePracticePlan({ durationBudgetMinutes: duration })
    return res.status(200).json({ success: true, plan })
  } catch (err) {
    console.error('generateAiPracticePlan error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/ai/analyze-weaknesses
 * On-demand AI weak topic analysis
 */
export async function getAiWeaknessAnalysis(req, res) {
  try {
    const analysis = await analyzeWeaknesses()
    return res.status(200).json({ success: true, analysis })
  } catch (err) {
    console.error('getAiWeaknessAnalysis error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/sync/leetcode
 * Sync recent LeetCode solved submissions
 */
export async function syncLeetCode(req, res) {
  try {
    const username = req.body.username || 'Manash_22'
    const syncRes = await syncLeetCodeRecentSubmissions(username)
    return res.status(200).json({ success: true, ...syncRes })
  } catch (err) {
    console.error('syncLeetCode error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/catalog/import
 * Import custom problem catalog from JSON
 */
export async function importCatalog(req, res) {
  try {
    const records = req.body.records || req.body
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'Expected JSON array of problem records' })
    }
    const report = importProblemCatalog(records)
    return res.status(200).json({ success: true, report })
  } catch (err) {
    console.error('importCatalog error:', err)
    return res.status(400).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/penalties/toggle
 */
export async function updatePenalties(req, res) {
  try {
    const { enabled } = req.body
    const result = togglePenalties(Boolean(enabled))
    return res.status(200).json({ success: true, ...result })
  } catch (err) {
    console.error('updatePenalties error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

/**
 * POST /api/v1/dsa/problems
 * Add any custom or free problem to the catalog by URL or Title
 */
export async function createProblem(req, res) {
  try {
    let {
      url,
      title,
      platform = 'leetcode',
      difficulty = 'Medium',
      primary_topic = 'Arrays',
      secondary_topics = [],
      patterns = [],
    } = req.body || {}

    if (!url && !title) {
      return res.status(400).json({ success: false, error: 'Problem URL or title is required' })
    }

    // If URL is provided, parse title and platform
    let slug = ''
    let canonicalUrl = url || ''

    if (url) {
      if (url.includes('leetcode.com')) {
        platform = 'leetcode'
        const match = url.match(/\/problems\/([^/?#]+)/)
        if (match) slug = match[1]
      } else if (url.includes('geeksforgeeks.org')) {
        platform = 'geeksforgeeks'
        const match = url.match(/\/problems\/([^/?#]+)/)
        if (match) slug = match[1]
      } else if (url.includes('interviewbit.com')) {
        platform = 'interviewbit'
        const match = url.match(/\/problems\/([^/?#]+)/)
        if (match) slug = match[1]
      } else if (url.includes('hackerrank.com')) {
        platform = 'hackerrank'
        const match = url.match(/\/challenges\/([^/?#]+)/)
        if (match) slug = match[1]
      }
    }

    if (!slug && title) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    if (!title && slug) {
      title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }

    if (!canonicalUrl) {
      canonicalUrl = platform === 'leetcode' 
        ? `https://leetcode.com/problems/${slug}/` 
        : platform === 'geeksforgeeks'
        ? `https://www.geeksforgeeks.org/problems/${slug}/`
        : platform === 'interviewbit'
        ? `https://www.interviewbit.com/problems/${slug}/`
        : platform === 'hackerrank'
        ? `https://www.hackerrank.com/challenges/${slug}/`
        : `https://example.com/problems/${slug}/`
    }

    const prefix = platform === 'leetcode' ? 'lc' : platform === 'geeksforgeeks' ? 'gfg' : platform === 'interviewbit' ? 'ib' : platform === 'hackerrank' ? 'hr' : 'oth'
    const id = `${prefix}-${slug}`

    const problemData = {
      id,
      platform,
      platform_problem_id: null,
      title,
      slug,
      canonical_url: canonicalUrl,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      primary_topic: primary_topic || 'Arrays',
      secondary_topics: JSON.stringify(Array.isArray(secondary_topics) ? secondary_topics : []),
      patterns: JSON.stringify(Array.isArray(patterns) ? patterns : []),
      is_free: 1,
      access_status: 'free',
      estimated_solve_time: difficulty === 'Hard' ? 40 : difficulty === 'Medium' ? 25 : 15,
      acceptance_rate: null,
      source: 'user_created',
    }

    db.prepare(`
      INSERT INTO dsa_problems (
        id, platform, platform_problem_id, title, slug, canonical_url,
        difficulty, primary_topic, secondary_topics, patterns,
        is_free, access_status, estimated_solve_time, acceptance_rate, source,
        created_at, updated_at
      ) VALUES (
        @id, @platform, @platform_problem_id, @title, @slug, @canonical_url,
        @difficulty, @primary_topic, @secondary_topics, @patterns,
        @is_free, @access_status, @estimated_solve_time, @acceptance_rate, @source,
        datetime('now'), datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        canonical_url = excluded.canonical_url,
        difficulty = excluded.difficulty,
        primary_topic = excluded.primary_topic,
        updated_at = datetime('now')
    `).run(problemData)

    const created = getProblemById(id)
    persistProblemToMongo(created).catch(() => {})
    return res.status(201).json({ success: true, message: 'Problem added to catalog successfully', problem: created })
  } catch (err) {
    console.error('createProblem error:', err)
    return res.status(500).json({ success: false, error: err.message || 'Failed to create problem' })
  }
}
