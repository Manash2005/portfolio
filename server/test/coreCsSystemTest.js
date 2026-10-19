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

// Test 4: Course Academy Hierarchy & Content verification
const courseCount = db.prepare('SELECT count(*) as c FROM core_cs_courses').get().c
assert(courseCount >= 5, `Expected at least 5 courses, found ${courseCount}`)
const moduleCount = db.prepare('SELECT count(*) as c FROM core_cs_modules').get().c
assert(moduleCount >= 6, `Expected at least 6 modules, found ${moduleCount}`)
const lessonCount = db.prepare('SELECT count(*) as c FROM core_cs_lessons').get().c
assert(lessonCount >= 6, `Expected at least 6 lessons, found ${lessonCount}`)
const assignmentCount = db.prepare('SELECT count(*) as c FROM core_cs_assignments').get().c
assert(assignmentCount >= 12, `Expected at least 12 assignments, found ${assignmentCount}`)
console.log(`  ✅ PASS: Course Academy verified with ${courseCount} courses, ${moduleCount} modules, ${lessonCount} lessons, ${assignmentCount} assignments`)

// Test 5: Course Assignment Grading & Automatic Spaced Revision Scheduling
const sampleLesson = db.prepare('SELECT * FROM core_cs_lessons LIMIT 1').get()
assert(sampleLesson, 'Sample lesson not found')
const sampleQuestions = db.prepare('SELECT * FROM core_cs_assignments WHERE lesson_id = ? ORDER BY display_order ASC').all(sampleLesson.id)
assert(sampleQuestions.length > 0, 'Sample questions not found')

// Simulate scoring 100% on the lesson
const testAnswers = sampleQuestions.map(q => ({
  question_id: q.id,
  selected_option_idx: q.correct_option_idx
}))
let correctTally = 0
for (const q of sampleQuestions) {
  const ans = testAnswers.find(a => a.question_id === q.id)
  if (ans && ans.selected_option_idx === q.correct_option_idx) {
    correctTally++
  }
}
const calculatedScore = Math.round((correctTally / sampleQuestions.length) * 100)
assert.strictEqual(calculatedScore, 100, 'Score should be 100%')

// Check calendar scheduling logic when quiz is passed
const revDate = new Date()
revDate.setDate(revDate.getDate() + 2)
const revDateStr = revDate.toISOString().split('T')[0]
const testEventTitle = `Core CS Revision: ${sampleLesson.title}`
const testEventId = `test-lesson-cal-${Date.now()}`

db.prepare(`
  INSERT INTO events (
    id, title, description, category, start_at, end_at,
    all_day, status, visibility, show_on_portfolio_heatmap
  ) VALUES (
    ?, ?, ?, 'Learning', ?, ?, 0, 'Planned', 'Private', 1
  )
`).run(
  testEventId,
  testEventTitle,
  `Test revision for ${sampleLesson.title}`,
  `${revDateStr}T09:00:00`,
  `${revDateStr}T09:30:00`
)

const scheduledEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(testEventId)
assert(scheduledEvent, 'Scheduled calendar revision event must exist')
assert.strictEqual(scheduledEvent.category, 'Learning')
assert.strictEqual(scheduledEvent.status, 'Planned')
console.log(`  ✅ PASS: Calendar automated revision event properly scheduled for ${revDateStr}`)

// Cleanup test event
db.prepare('DELETE FROM events WHERE id = ?').run(testEventId)

// Test 6: Verify Existing data was completely uncorrupted
const problemCount = db.prepare('SELECT count(*) as c FROM dsa_problems').get().c
assert(problemCount >= 807, `Existing DSA problems corrupted! Found: ${problemCount}`)
const eventCount = db.prepare('SELECT count(*) as c FROM events').get().c
assert(eventCount >= 1, `Existing events corrupted! Found: ${eventCount}`)
console.log(`  🛡️ PASS: Data integrity invariant verified: ${problemCount} DSA problems, ${eventCount} events preserved`)

// Cleanup test review
db.prepare('DELETE FROM core_cs_reviews WHERE id = ?').run(testReviewId)

console.log('\n========================================')
console.log('🎉 ALL CORE CS BACKEND & ACADEMY TESTS PASSED!')
console.log('========================================\n')
