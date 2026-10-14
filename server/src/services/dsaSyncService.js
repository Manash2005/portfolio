import { db } from '../db/database.js'
import crypto from 'node:crypto'
import { persistProblemToMongo } from '../db/mongoPersistence.js'

/**
 * Sync recently solved problems from LeetCode GraphQL without fabricating durations
 */
export async function syncLeetCodeRecentSubmissions(username = 'Manash_22') {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username, limit: 20 } }),
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) {
      throw new Error(`LeetCode API returned HTTP ${response.status}`)
    }

    const data = await response.json()
    const submissions = data?.data?.recentAcSubmissionList || []

    let importedCount = 0
    let alreadySyncedCount = 0

    const runSync = db.transaction(() => {
      for (const sub of submissions) {
        const slug = sub.titleSlug
        const title = sub.title
        const solvedAt = new Date(Number(sub.timestamp) * 1000).toISOString()

        // 1. Check if problem exists in dsa_problems
        let problem = db.prepare('SELECT id FROM dsa_problems WHERE slug = ?').get(slug)

        if (!problem) {
          // Insert problem record with verified metadata
          const problemId = `lc-${slug}`
          db.prepare(`
            INSERT INTO dsa_problems (
              id, platform, platform_problem_id, title, slug, canonical_url,
              difficulty, primary_topic, secondary_topics, patterns,
              is_free, access_status, estimated_solve_time, source
            ) VALUES (
              ?, 'leetcode', ?, ?, ?, ?,
              'Medium', 'Arrays', '[]', '[]',
              1, 'free', 25, 'leetcode_sync'
            )
          `).run(
            problemId,
            sub.id,
            title,
            slug,
          problem = { id: problemId }
          persistProblemToMongo({
            id: problemId,
            platform: 'leetcode',
            platform_problem_id: sub.id,
            title,
            slug,
            canonical_url: `https://leetcode.com/problems/${slug}/`,
            difficulty: 'Medium',
            primary_topic: 'Arrays',
            secondary_topics: [],
            patterns: [],
            is_free: 1,
            access_status: 'free',
            estimated_solve_time: 25,
            source: 'leetcode_sync'
          }).catch(() => {})
        }

        // 2. Check if this exact submission was already imported
        const existingAttempt = db
          .prepare(
            `SELECT id FROM dsa_attempts 
             WHERE problem_id = ? AND source = 'leetcode_sync' AND started_at = ?`
          )
          .get(problem.id, solvedAt)

        if (existingAttempt) {
          alreadySyncedCount++
          continue
        }

        // 3. Record attempt with duration_seconds = NULL (prompt: never fabricate durations for imported history!)
        const attemptId = crypto.randomUUID()
        db.prepare(`
          INSERT INTO dsa_attempts (
            id, problem_id, attempt_number, started_at, ended_at, duration_seconds,
            result, is_independent, hints_used, solution_viewed, language,
            confidence_rating, notes, source, xp_awarded, created_at
          ) VALUES (
            ?, ?, 1, ?, ?, NULL,
            'solved', 1, 0, 0, 'Unknown',
            3, 'Imported from LeetCode recent solved submissions (duration unknown).', 'leetcode_sync', 30, ?
          )
        `).run(attemptId, problem.id, solvedAt, solvedAt, solvedAt)

        importedCount++
      }
    })

    runSync()

    return {
      success: true,
      username,
      totalFetched: submissions.length,
      importedCount,
      alreadySyncedCount,
      syncTimestamp: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[DSA Sync] LeetCode sync error:', err.message)
    return {
      success: false,
      error: err.message,
      syncTimestamp: new Date().toISOString(),
    }
  }
}
