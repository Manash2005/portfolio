import assert from 'assert'
import { getDatabase } from '../src/db/database.js'
import { analyzeBlogWithAi } from '../src/services/blogAiService.js'
import { pruneStaleCalendarRevisions, syncRevisionToCalendar } from '../src/services/dsaMasteryService.js'

console.log('🧪 Starting Curated Blogs & Calendar Revision Verification Suite...')

async function runTests() {
  const db = getDatabase()

  // --- Test 1: Verify blogs table exists in SQLite schema ---
  const hasBlogsTable = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='blogs'").get().c > 0
  assert.strictEqual(hasBlogsTable, true, 'blogs table should exist in database')
  console.log('  ✅ PASS: blogs table exists with indexes in SQLite')

  // --- Test 2: AI / Heuristic Analysis preserves verbatim text ---
  const sampleScraped = {
    title: 'Understanding the Raft Consensus Algorithm',
    originalUrl: 'https://raft.github.io/raft.pdf',
    originalAuthor: 'Diego Ongaro and John Ousterhout',
    publishedDate: '2026-05-15',
    summary: 'Raft is a consensus algorithm designed as an alternative to Paxos.',
    readingTimeMinutes: 12,
    wordCount: 2400,
    allImages: [
      {
        src: 'https://raft.github.io/images/raft-subproblems.png',
        alt: 'Raft decomposed subproblems',
        caption: 'Figure 1: Leader election, log replication, and safety.',
      },
    ],
    sections: [
      {
        heading: 'Introduction',
        level: 2,
        blocks: [
          {
            type: 'paragraph',
            text: 'Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos.',
          },
          {
            type: 'image',
            src: 'https://raft.github.io/images/raft-subproblems.png',
            alt: 'Raft decomposed subproblems',
            caption: 'Figure 1: Leader election, log replication, and safety.',
          },
        ],
      },
      {
        heading: 'Leader Election',
        level: 2,
        blocks: [
          {
            type: 'paragraph',
            text: 'Raft uses a heartbeat mechanism to trigger leader election. When servers start up, they begin as followers.',
          },
          {
            type: 'code',
            language: 'go',
            code: 'func (rf *Raft) startElection() {\n  rf.currentTerm++\n  rf.votedFor = rf.me\n}',
          },
        ],
      },
    ],
    rawMarkdown: '# Understanding the Raft Consensus Algorithm\n\nVerbatim content...',
  }

  const analysis = await analyzeBlogWithAi(sampleScraped)
  assert(analysis.topic, 'Should produce a topic')
  assert(Array.isArray(analysis.subtopics) && analysis.subtopics.length > 0, 'Should produce subtopics')
  assert(analysis.topic === 'Distributed Systems', 'Raft should be classified as Distributed Systems')
  assert(Array.isArray(analysis.keyTakeaways) && analysis.keyTakeaways.length > 0, 'Should produce key takeaways')
  // Verify that the scraper verbatim text remained unchanged
  assert.strictEqual(
    sampleScraped.sections[1].blocks[0].text,
    'Raft uses a heartbeat mechanism to trigger leader election. When servers start up, they begin as followers.'
  )
  console.log(`  ✅ PASS: AI analysis classified "${analysis.topic}" with ${analysis.subtopics.length} subtopics without modifying verbatim text`)

  // --- Test 3: Insert and Query Curated Blog in Database ---
  const testBlogId = 'blog_test_raft_consensus_123'
  const testSlug = 'understanding-the-raft-consensus-algorithm-test'

  // Clean if previously inserted
  db.prepare('DELETE FROM blogs WHERE id = ? OR slug = ?').run(testBlogId, testSlug)

  db.prepare(`
    INSERT INTO blogs (
      id, title, slug, original_url, original_author, published_date,
      topic, subtopics, summary, cover_image, reading_time_minutes,
      content_json, key_takeaways, raw_markdown, is_published
    ) VALUES (
      @id, @title, @slug, @original_url, @original_author, @published_date,
      @topic, @subtopics, @summary, @cover_image, @reading_time_minutes,
      @content_json, @key_takeaways, @raw_markdown, @is_published
    )
  `).run({
    id: testBlogId,
    title: sampleScraped.title,
    slug: testSlug,
    original_url: sampleScraped.originalUrl,
    original_author: sampleScraped.originalAuthor,
    published_date: sampleScraped.publishedDate,
    topic: analysis.topic,
    subtopics: JSON.stringify(analysis.subtopics),
    summary: analysis.summary,
    cover_image: analysis.coverImage,
    reading_time_minutes: analysis.readingTimeMinutes,
    content_json: JSON.stringify(sampleScraped.sections),
    key_takeaways: JSON.stringify(analysis.keyTakeaways),
    raw_markdown: sampleScraped.rawMarkdown,
    is_published: 1,
  })

  const fetched = db.prepare('SELECT * FROM blogs WHERE slug = ?').get(testSlug)
  assert(fetched, 'Should fetch inserted blog by slug')
  assert.strictEqual(fetched.title, sampleScraped.title)
  assert.strictEqual(fetched.topic, 'Distributed Systems')

  const parsedContent = JSON.parse(fetched.content_json)
  assert.strictEqual(parsedContent.length, 2)
  assert.strictEqual(parsedContent[0].heading, 'Introduction')
  assert.strictEqual(parsedContent[0].blocks[1].type, 'image')
  assert.strictEqual(parsedContent[0].blocks[1].src, 'https://raft.github.io/images/raft-subproblems.png')
  assert.strictEqual(parsedContent[1].blocks[1].type, 'code')
  assert.strictEqual(parsedContent[1].blocks[1].language, 'go')
  console.log('  ✅ PASS: Blog inserted and queried with verbatim code blocks, images, and section tree')

  // Clean test blog
  db.prepare('DELETE FROM blogs WHERE id = ?').run(testBlogId)

  // --- Test 4: Calendar Revision Pruning & Movement Verification ---
  const testProblemId = 'catalog-two-sum-0001'
  // Ensure test problem exists in catalog
  db.prepare(`
    INSERT OR IGNORE INTO dsa_problems (
      id, title, slug, difficulty, primary_topic, platform, canonical_url, is_free, created_at
    ) VALUES (
      ?, 'Two Sum Test', 'two-sum-test', 'Easy', 'Arrays & Hashing', 'LeetCode', 'https://leetcode.com/problems/two-sum/', 1, datetime('now')
    )
  `).run(testProblemId)

  // Schedule revision for Oct 10 (past)
  syncRevisionToCalendar(testProblemId, '2026-10-10', 1)
  let pastEv = db.prepare("SELECT * FROM events WHERE id = ?").get(`rev_${testProblemId}`)
  assert(pastEv, 'Event should exist on Oct 10')
  assert.strictEqual(pastEv.start_at, '2026-10-10T09:00:00')

  // Now problem is solved and rescheduled to Oct 25 (future)
  db.prepare(`
    INSERT INTO dsa_revision_schedule (problem_id, last_solved_at, next_revision_due, interval_days, repetition_count, ease_factor, status)
    VALUES (?, '2026-10-18', '2026-10-25', 7, 2, 2.5, 'upcoming')
    ON CONFLICT(problem_id) DO UPDATE SET
      last_solved_at = excluded.last_solved_at,
      next_revision_due = excluded.next_revision_due,
      interval_days = excluded.interval_days,
      repetition_count = excluded.repetition_count
  `).run(testProblemId)

  // Reschedule to Oct 25
  syncRevisionToCalendar(testProblemId, '2026-10-25', 7)
  pruneStaleCalendarRevisions(testProblemId)

  // Event should now be on Oct 25, and NOT Oct 10
  const currentEv = db.prepare("SELECT * FROM events WHERE id = ?").get(`rev_${testProblemId}`)
  assert(currentEv, 'Event should exist')
  assert.strictEqual(currentEv.start_at, '2026-10-25T09:00:00', 'Event should have moved to next scheduled date (2026-10-25)')

  // Check no events exist for this problem on 2026-10-10
  const oldEvents = db.prepare("SELECT * FROM events WHERE id = ? AND date(start_at) < '2026-10-25'").all(`rev_${testProblemId}`)
  assert.strictEqual(oldEvents.length, 0, 'No stale planned events should remain on older dates')

  console.log('  ✅ PASS: Calendar revision moved to future date and old date pruned from database')

  // Clean test problem & event
  db.prepare('DELETE FROM events WHERE id = ?').run(`rev_${testProblemId}`)
  db.prepare('DELETE FROM dsa_revision_schedule WHERE problem_id = ?').run(testProblemId)
  db.prepare('DELETE FROM dsa_problems WHERE id = ?').run(testProblemId)

  console.log('\n========================================')
  console.log('🎉 ALL BLOG & REVISION CALENDAR TESTS PASSED!')
  console.log('========================================\n')
  process.exit(0)
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
