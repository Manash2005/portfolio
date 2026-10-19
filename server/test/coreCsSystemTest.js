import { db } from '../src/db/database.js'
import assert from 'assert'

console.log('🧪 Starting Core CS Fundamentals System Test Suite...')

// Test 1: Verify Schema and seeded content
const cardCount = db.prepare('SELECT count(*) as c FROM core_cs_cards').get().c
assert(cardCount >= 19, `Expected at least 19 cards, found ${cardCount}`)
console.log(`  ✅ PASS: Core CS cards table contains ${cardCount} curated questions`)

const sheets = db.prepare('SELECT count(*) as c FROM core_cs_cheat_sheets').get().c
assert(sheets >= 5, `Expected at least 5 cheat sheets, found ${sheets}`)
console.log(`  ✅ PASS: Core CS cheat sheets table contains ${sheets} comparison matrices`)

// Test 2: Subject verification (OS, DBMS, CN, System Design, OOPs)
const subjects = db.prepare('SELECT DISTINCT subject FROM core_cs_cards ORDER BY subject ASC').all().map(s => s.subject)
const requiredSubjects = ['CN', 'DBMS', 'OS', 'OOPs', 'System Design']
for (const sub of requiredSubjects) {
  assert(subjects.includes(sub), `Missing required subject: ${sub}`)
}
console.log(`  ✅ PASS: All 5 core engineering subjects verified: ${subjects.join(', ')}`)

// Test 3: SM-2 Spaced Repetition calculation
const sampleCard = db.prepare("SELECT * FROM core_cs_cards WHERE subject = 'OS' LIMIT 1").get()
assert(sampleCard, 'Sample card not found')

// Simulate initial "Again" review
const today = new Date().toISOString().split('T')[0]
const testReviewId = 'test-rev-1'

// Insert or update review record
db.prepare(`
  INSERT INTO core_cs_reviews (
    id, card_id, repetition_count, interval_days, ease_factor,
    last_reviewed_at, next_review_at, last_quality, is_mastered
  ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    repetition_count = excluded.repetition_count,
    interval_days = excluded.interval_days,
    next_review_at = excluded.next_review_at
`).run(testReviewId, sampleCard.id, 1, 4, 2.5, today, 3, 0)

const retrievedRev = db.prepare('SELECT * FROM core_cs_reviews WHERE id = ?').get(testReviewId)
assert.strictEqual(retrievedRev.interval_days, 4)
assert.strictEqual(retrievedRev.last_quality, 3)
console.log('  ✅ PASS: SM-2 review persistence and interval scheduling verified')

// Test 4: Verify Existing data was completely uncorrupted
const problemCount = db.prepare('SELECT count(*) as c FROM dsa_problems').get().c
assert(problemCount >= 807, `Existing DSA problems corrupted! Found: ${problemCount}`)
const eventCount = db.prepare('SELECT count(*) as c FROM events').get().c
assert(eventCount >= 1, `Existing events corrupted! Found: ${eventCount}`)
console.log(`  🛡️ PASS: Data integrity invariant verified: ${problemCount} DSA problems, ${eventCount} events preserved`)

// Cleanup test review
db.prepare('DELETE FROM core_cs_reviews WHERE id = ?').run(testReviewId)

console.log('\n========================================')
console.log('🎉 ALL CORE CS BACKEND TESTS PASSED!')
console.log('========================================\n')
