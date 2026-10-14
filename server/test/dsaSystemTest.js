import { db } from '../src/db/database.js'
import {
  getProblems,
  getProblemById,
  importProblemCatalog,
  getCatalogStats,
} from '../src/services/dsaCatalogService.js'
import {
  recordAttempt,
  getRecentAttempts,
} from '../src/services/dsaAttemptService.js'
import {
  getTopicMasteryStats,
  getRevisionQueue,
  getDeterministicPracticePlan,
} from '../src/services/dsaMasteryService.js'
import {
  getGameProfile,
  togglePenalties,
} from '../src/services/dsaGamificationService.js'
import {
  logMistake,
  getMistakes,
  getMistakeAnalytics,
} from '../src/services/dsaMistakeService.js'
import {
  generatePracticePlan,
  analyzeWeaknesses,
} from '../src/services/dsaAiCoachService.js'
import assert from 'node:assert'

async function runDsaTests() {
  console.log('🧪 Starting DSA Arena Comprehensive Verification Suite...\n')
  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`)
      console.error(err)
      failed++
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn()
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`)
      console.error(err)
      failed++
    }
  }

  // TEST SUITE 1: Question Bank Catalog
  test('Catalog has seeded problems with canonical URLs and topics', () => {
    const stats = getCatalogStats()
    assert(stats.total >= 50, `Expected at least 50 problems, got ${stats.total}`)
    assert(stats.freeCount >= 50, `Expected freeCount >= 50, got ${stats.freeCount}`)
    assert(stats.platformCounts.length >= 2, 'Expected at least LeetCode and GFG platforms')
  })

  test('Filtering problems by topic, difficulty, and search', () => {
    const arraysRes = getProblems({ topic: 'Arrays', limit: 10 })
    assert(arraysRes.problems.length > 0, 'Should find Array problems')
    arraysRes.problems.forEach((p) => {
      assert(
        p.primary_topic === 'Arrays' || p.secondary_topics.includes('Arrays'),
        `Problem ${p.title} does not match Arrays topic`
      )
    })

    const easyRes = getProblems({ difficulty: 'Easy', limit: 10 })
    assert(easyRes.problems.length > 0, 'Should find Easy problems')
    easyRes.problems.forEach((p) => assert.strictEqual(p.difficulty, 'Easy'))

    const searchRes = getProblems({ search: 'Two Sum' })
    assert(searchRes.problems.some((p) => p.title.toLowerCase().includes('two sum')))
  })

  // TEST SUITE 2: Problem Detail & Deterministic Mastery
  test('Problem detail retrieval and unattempted mastery status', () => {
    const prob = getProblemById('lc-1')
    assert(prob, 'Should find problem lc-1')
    assert.strictEqual(prob.title, 'Two Sum')
    assert.strictEqual(prob.canonical_url, 'https://leetcode.com/problems/two-sum/')
    assert(prob.mastery, 'Should include mastery object')
    assert.strictEqual(prob.mastery.level, 'New')
    assert.strictEqual(prob.mastery.score, 0)
  })

  // TEST SUITE 3: Practice Attempt Recording & Timed Solver
  test('Record independent timed solve attempt with XP attribution', () => {
    const started = new Date(Date.now() - 12 * 60 * 1000).toISOString()
    const ended = new Date().toISOString()
    const duration = 12 * 60 // 12 minutes (under 15m estimated solve time -> speed bonus)

    const result = recordAttempt({
      problem_id: 'lc-1',
      started_at: started,
      ended_at: ended,
      duration_seconds: duration,
      result: 'solved',
      is_independent: 1,
      hints_used: 0,
      solution_viewed: 0,
      language: 'Java',
      confidence_rating: 5,
      notes: 'Clean O(N) hash map solution.',
      linkToCalendar: true,
    })

    assert(result.success, 'Attempt should succeed')
    assert.strictEqual(result.attempt.result, 'solved')
    assert.strictEqual(result.attempt.is_independent, 1)
    // XP breakdown: 50 base + 30 independent + 20 speed (<15m) = 100 XP
    assert(result.xpEarned >= 80, `Expected >= 80 XP, got ${result.xpEarned}`)

    // Verify problem mastery updated
    const updatedProb = getProblemById('lc-1')
    assert.strictEqual(updatedProb.mastery.level, 'Practicing')
    assert.strictEqual(updatedProb.attempts.length >= 1, true)
  })

  test('Honesty enforcement: viewing solution disallows independent bonus', () => {
    const result = recordAttempt({
      problem_id: 'lc-242',
      duration_seconds: 600,
      result: 'solved',
      is_independent: 1, // User claimed independent
      hints_used: 2,     // But used 2 hints!
      solution_viewed: 1,// And viewed solution!
      language: 'Java',
    })

    assert.strictEqual(result.attempt.is_independent, 0, 'Must force is_independent = 0 when hints or solution viewed')
    // No independent bonus (30) awarded
    assert(result.xpEarned <= 70, `Assisted solve should not get independent bonus, got ${result.xpEarned}`)
  })

  // TEST SUITE 4: Spaced Repetition Queue
  test('Spaced repetition schedule updated on solve', () => {
    const queue = getRevisionQueue()
    assert(queue, 'Queue should exist')
    assert(Array.isArray(queue.overdue), 'overdue must be array')
    assert(Array.isArray(queue.dueToday), 'dueToday must be array')
    assert(Array.isArray(queue.upcoming), 'upcoming must be array')
  })

  // TEST SUITE 5: Mistake Journal
  test('Log mistake and verify category analytics', () => {
    const mistake = logMistake({
      problem_id: 'lc-49',
      category: 'edge_cases',
      mistake_description: 'Forgot to handle empty array and empty string anagrams.',
      lesson_learned: 'Always write tests for [] and [""] before submitting.',
    })

    assert(mistake, 'Mistake should be logged')
    assert.strictEqual(mistake.category, 'edge_cases')
    assert.strictEqual(mistake.problem_title, 'Group Anagrams')

    const analytics = getMistakeAnalytics()
    assert(analytics.total >= 1, 'Total mistakes should be >= 1')
    assert(analytics.categoryCounts.some((c) => c.category === 'edge_cases'))
  })

  // TEST SUITE 6: Gamification Profile & Streaks
  test('Game profile tracks XP, level, and streak', () => {
    const profile = getGameProfile()
    assert(profile.total_xp > 0, 'Total XP should have increased from attempts')
    assert(profile.levelInfo, 'Level info should be computed')
    assert(['Novice', 'Apprentice', 'Problem Solver'].includes(profile.current_level))
    assert(profile.current_streak >= 1, 'Current streak should be at least 1')

    const penRes = togglePenalties(true)
    assert.strictEqual(penRes.penalties_enabled, 1)
  })

  // TEST SUITE 7: AI Coach & Deterministic Prioritization
  test('Deterministic practice plan works offline with genuine problem IDs', () => {
    const plan = getDeterministicPracticePlan(45)
    assert(plan, 'Plan should be generated')
    assert.strictEqual(plan.generated_by, 'deterministic')
    assert(plan.items.length >= 2, 'Should recommend at least 2 problems')
    plan.items.forEach((item) => {
      assert(item.problem_id, 'Item must have problem_id')
      assert(item.title, 'Item must have title')
      assert(item.canonical_url.startsWith('http'), 'URL must be canonical')
      // Verify problem exists in SQLite database
      const row = db.prepare('SELECT id FROM dsa_problems WHERE id = ?').get(item.problem_id)
      assert(row, `Problem ID ${item.problem_id} must exist in SQLite database`)
    })
  })

  await testAsync('AI Coach generatePracticePlan with fallback safety and SQLite validation', async () => {
    const plan = await generatePracticePlan({ durationBudgetMinutes: 45 })
    assert(plan, 'AI Coach plan should return a plan')
    assert(plan.items.length >= 1, 'Should contain recommended items')
    // Verify EVERY single problem ID exists in SQLite
    plan.items.forEach((item) => {
      const dbProblem = db.prepare('SELECT id FROM dsa_problems WHERE id = ?').get(item.problem_id)
      assert(dbProblem, `Recommended problem ID ${item.problem_id} MUST exist in SQLite`)
    })
  })

  await testAsync('AI Weakness analysis produces actionable feedback', async () => {
    const analysis = await analyzeWeaknesses()
    assert(analysis, 'Analysis should return')
    assert(analysis.weakTopicsSummary, 'Should have weak topics summary')
    assert(Array.isArray(analysis.actionableAdvice), 'Actionable advice must be array')
  })

  // TEST SUITE 8: Safe Catalog Import
  test('Catalog import validation and duplicate safety', () => {
    const testRecords = [
      {
        id: 'test-prob-1',
        platform: 'leetcode',
        platform_problem_id: '9999',
        title: 'Custom Test Problem 1',
        slug: 'custom-test-problem-1',
        canonical_url: 'https://leetcode.com/problems/custom-test-problem-1/',
        difficulty: 'Medium',
        primary_topic: 'Dynamic Programming',
        is_free: 1,
      },
    ]

    const report1 = importProblemCatalog(testRecords)
    assert.strictEqual(report1.imported, 1)

    // Re-import should update, NOT create duplicate
    const report2 = importProblemCatalog(testRecords)
    assert.strictEqual(report2.updated, 1)
    assert.strictEqual(report2.imported, 0)

    // Cleanup test record
    db.prepare('DELETE FROM dsa_problems WHERE id = ?').run('test-prob-1')
  })

  // Clean any test artifacts generated during test suite
  const { cleanDummyData } = await import('../src/db/cleanDummyData.js')
  cleanDummyData()

  console.log(`\n========================================`)
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log(`========================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runDsaTests().catch((err) => {
  console.error('Test runner fatal error:', err)
  process.exit(1)
})
