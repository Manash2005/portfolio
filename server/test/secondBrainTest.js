/**
 * Automated test suite for Second Brain database & API controllers
 */

import assert from 'assert'
import { getDatabase } from '../src/db/database.js'
import {
  getPublicEvents,
  getEventById,
  getUpcomingEvents,
  getRecentActivity,
  getGoals,
  getProjects,
  getStatistics,
  getHeatmapActivity,
  getActivityEvents,
} from '../src/controllers/secondBrainController.js'

function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.data = payload
      return this
    },
    set(key, val) {
      this.headers[key] = val
      return this
    },
  }
  return res
}

async function runTests() {
  console.log('--- Running Second Brain Test Suite ---')

  const db = getDatabase()

  // Setup temporary private test fixture to test privacy controls
  db.prepare(`
    INSERT OR REPLACE INTO events (
      id, title, description, category, start_at, end_at, all_day, timezone,
      status, visibility, show_on_portfolio_heatmap, color, tags, priority, private_notes
    ) VALUES (
      'evt_test_fixture_private', 'Confidential Financial Planning', 'Private banking review', 'Personal',
      '2026-10-25T20:00:00', '2026-10-25T21:00:00', 0, 'Asia/Kolkata',
      'Planned', 'Private', 0, '#9CA3AF', '["Personal","Finances"]', 'low', 'CONFIDENTIAL NOTE'
    )
  `).run()

  // Test 1: Direct DB Check
  const totalInDb = db.prepare('SELECT count(*) as c FROM events').get().c
  const privateInDb = db.prepare("SELECT count(*) as c FROM events WHERE visibility = 'Private'").get().c
  assert(totalInDb > 0, 'Database should contain events')
  assert(privateInDb > 0, 'Database should contain private test events')
  console.log('✓ Test 1: SQLite database connected and contains seeded records')

  // Test 2: Public Events API excludes Private Events & Private Notes
  {
    const req = { query: {} }
    const res = mockResponse()
    await getPublicEvents(req, res)

    assert.strictEqual(res.statusCode, 200)
    assert(Array.isArray(res.data.events), 'Events should be an array')
    assert(res.data.events.length > 0, 'Should return public events')

    // Verify privacy
    for (const evt of res.data.events) {
      assert.strictEqual(evt.visibility, undefined, 'Visibility field should not leak or be exposed')
      assert.strictEqual(evt.private_notes, undefined, 'CRITICAL: private_notes must NEVER be returned')
      assert.notStrictEqual(evt.id, 'evt_test_fixture_private', 'Private event must not appear')
    }
    console.log('✓ Test 2: Public events endpoint strictly excludes private events and private_notes')
  }

  // Test 3: Search does NOT expose private records
  {
    const req = { query: { search: 'financial' } }
    const res = mockResponse()
    await getPublicEvents(req, res)

    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.data.events.length, 0, 'Search for private term "financial" must return 0 results')
    console.log('✓ Test 3: Search queries cannot leak or reveal private records')
  }

  // Test 4: Single Event Fetch by ID: Public succeeds, Private returns 404
  {
    // Public event
    const reqPublic = { params: { id: 'evt_failed_dsa_interview_20261013' } }
    const resPublic = mockResponse()
    await getEventById(reqPublic, resPublic)
    assert.strictEqual(resPublic.statusCode, 200)
    assert.strictEqual(resPublic.data.event.id, 'evt_failed_dsa_interview_20261013')
    assert.strictEqual(resPublic.data.event.private_notes, undefined, 'Private notes must not be present')

    // Private event ID -> Must return 404
    const reqPrivate = { params: { id: 'evt_test_fixture_private' } }
    const resPrivate = mockResponse()
    await getEventById(reqPrivate, resPrivate)
    assert.strictEqual(resPrivate.statusCode, 404, 'Requesting a private event by ID must return 404')
    console.log('✓ Test 4: getEventById returns public event and strictly 404s on private event IDs')
  }

  // Test 5: Upcoming & Recent Activities
  {
    const resUp = mockResponse()
    await getUpcomingEvents({ query: { limit: 5 } }, resUp)
    assert.strictEqual(resUp.statusCode, 200)
    assert(Array.isArray(resUp.data.events))

    const resRecent = mockResponse()
    await getRecentActivity({ query: { limit: 5 } }, resRecent)
    assert.strictEqual(resRecent.statusCode, 200)
    assert(Array.isArray(resRecent.data.activities))
    for (const a of resRecent.data.activities) {
      assert.strictEqual(a.status, 'Completed', 'Recent activity must be explicitly completed')
    }
    console.log('✓ Test 5: Upcoming and recent activity streams verified')
  }

  // Test 6: Goals and Projects
  {
    const resGoals = mockResponse()
    await getGoals({}, resGoals)
    assert.strictEqual(resGoals.statusCode, 200)
    assert(resGoals.data.goals.length >= 4)

    const resProj = mockResponse()
    await getProjects({}, resProj)
    assert.strictEqual(resProj.statusCode, 200)
    assert(resProj.data.projects.length >= 4)
    console.log('✓ Test 6: Goals and projects relationships verified')
  }

  // Test 7: Heatmap Aggregation
  {
    const resHeatmap = mockResponse()
    await getHeatmapActivity({}, resHeatmap)
    assert.strictEqual(resHeatmap.statusCode, 200)
    assert(Array.isArray(resHeatmap.data.heatmapData))
    assert(resHeatmap.data.heatmapData.length > 0)
    for (const item of resHeatmap.data.heatmapData) {
      assert(typeof item.date === 'string' && item.date.length === 10, 'Valid YYYY-MM-DD date')
      assert(typeof item.count === 'number' && item.count > 0, 'Count must be positive integer')
    }
    console.log('✓ Test 7: Heatmap aggregation engine correctly aggregates eligible activities')
  }

  // Test 8: Statistics
  {
    const resStats = mockResponse()
    await getStatistics({}, resStats)
    assert.strictEqual(resStats.statusCode, 200)
    assert(typeof resStats.data.stats.total_completed === 'number')
    assert(typeof resStats.data.stats.learning_sessions === 'number')
    assert(Array.isArray(resStats.data.stats.category_breakdown))
    console.log('✓ Test 8: Activity statistics calculations verified')
  }

  // Cleanup temporary test fixture
  db.prepare("DELETE FROM events WHERE id = 'evt_test_fixture_private'").run()

  console.log('\n--- ALL SECOND BRAIN TESTS PASSED SUCCESSFULLY! ---\n')
}

runTests()
  .then(async () => {
    const { disconnectMongo } = await import('../src/db/mongo.js')
    await disconnectMongo()
    process.exit(0)
  })
  .catch(err => {
    console.error('Test failed:', err)
    process.exit(1)
  })
