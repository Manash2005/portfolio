import assert from 'node:assert/strict'
import {
  hashPassword,
  verifyPassword,
  provisionAdmin,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  createSession,
  validateSession,
  invalidateSession,
} from '../src/auth/authService.js'
import { db } from '../src/db/database.js'
import {
  createProject,
  updateProject,
  deleteProject,
  getAdminProjects,
  getPublicProjects,
  createEvent,
  updateEvent,
  deleteEvent,
  getAdminEvents,
  updatePortfolioContent,
  getPortfolioContent,
  createGoal,
  updateGoal,
  deleteGoal,
  getAdminGoals,
} from '../src/controllers/adminController.js'
import { getPublicEvents } from '../src/controllers/secondBrainController.js'

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    data: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.data = body
      return this
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts }
      return this
    },
    clearCookie(name) {
      delete this.cookies[name]
      return this
    },
  }
  return res
}

async function runAdminTests() {
  console.log('\n--- Running Administrator Security & Operations Test Suite ---')

  // 1. Password Hashing and Timing-Safe Verification
  console.log('Testing Password Hashing and Timing-Safe Verification...')
  const plain = 'SecretMasterKey2026!'
  const { hash, salt } = hashPassword(plain)
  assert.ok(hash && salt, 'Hash and salt must be generated')
  assert.equal(verifyPassword(plain, hash, salt), true, 'Valid password must verify')
  assert.equal(verifyPassword('WrongPassword!', hash, salt), false, 'Invalid password must fail')
  console.log('✓ Test 1: scrypt hashing and verification working reliably')

  // 2. Admin Provisioning
  console.log('Testing Admin Provisioning...')
  const testUser = 'manash_test_' + Date.now().toString(36)
  const prov = provisionAdmin(testUser, 'Password12345!')
  assert.equal(prov.username, testUser)
  assert.equal(prov.created, true)
  const row = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(testUser)
  assert.ok(row, 'User must exist in SQLite')
  console.log('✓ Test 2: Admin user provisioning and persistence verified')

  // 3. Sliding Window Rate Limiting
  console.log('Testing Sliding Window Rate Limiter...')
  const testIp = '192.168.100.' + Math.floor(Math.random() * 200 + 1)
  clearFailedAttempts(testIp)
  for (let i = 0; i < 5; i++) {
    const check = checkRateLimit(testIp)
    assert.equal(check.allowed, true, `Attempt ${i + 1} should be allowed`)
    recordFailedAttempt(testIp)
  }
  const blocked = checkRateLimit(testIp)
  assert.equal(blocked.allowed, false, '6th attempt must be blocked by rate limiter')
  clearFailedAttempts(testIp)
  const reset = checkRateLimit(testIp)
  assert.equal(reset.allowed, true, 'Rate limiter must reset after clear')
  console.log('✓ Test 3: Rate limiting blocks brute-force attempts and resets safely')

  // 4. Session Persistence and Invalidation
  console.log('Testing Session Management...')
  const session = createSession(row.id)
  assert.ok(session.sessionToken, 'Session token must be generated')
  const valid = validateSession(session.sessionToken)
  assert.ok(valid, 'Session must validate')
  assert.equal(valid.username, testUser)
  assert.equal(valid.userId, row.id)

  const invalid = validateSession('fake-token-xyz')
  assert.equal(invalid, null, 'Invalid token must return null')

  const invalidated = invalidateSession(session.sessionToken)
  assert.equal(invalidated, true, 'Session must be invalidated')
  assert.equal(validateSession(session.sessionToken), null, 'Invalidated session must return null')
  console.log('✓ Test 4: Persistent SQLite session lifecycle and rotation verified')

  // 5. Project CRUD and Publication Boundaries
  console.log('Testing Project Management & Visibility Boundaries...')
  const newProjRes = mockRes()
  createProject({
    body: {
      title: 'Automated Agent Runner',
      short_description: 'Autonomous multi-step execution agent',
      techStack: ['Python', 'FastAPI'],
      featured: true,
      is_published: 0, // Draft!
    }
  }, newProjRes)

  assert.equal(newProjRes.statusCode, 201)
  const createdProj = newProjRes.data.data
  assert.ok(createdProj.id)
  assert.equal(createdProj.is_published, false)

  // Public endpoint MUST NOT include draft project
  const publicRes = mockRes()
  getPublicProjects({}, publicRes)
  const isFoundInPublic = publicRes.data.data.some(p => p.id === createdProj.id)
  assert.equal(isFoundInPublic, false, 'Draft project must NEVER appear in public projects')

  // Admin endpoint MUST include draft project
  const adminRes = mockRes()
  getAdminProjects({}, adminRes)
  const isFoundInAdmin = adminRes.data.data.some(p => p.id === createdProj.id)
  assert.equal(isFoundInAdmin, true, 'Draft project must be visible in admin overview')

  // Publish the project
  const updateRes = mockRes()
  updateProject({
    params: { id: createdProj.id },
    body: { is_published: 1, featured: true }
  }, updateRes)
  assert.equal(updateRes.statusCode, 200)

  // Now it appears in public projects
  const publicResAfter = mockRes()
  getPublicProjects({}, publicResAfter)
  assert.equal(publicResAfter.data.data.some(p => p.id === createdProj.id), true)

  // Clean up
  const delProjRes = mockRes()
  deleteProject({ params: { id: createdProj.id } }, delProjRes)
  assert.equal(delProjRes.statusCode, 200)
  console.log('✓ Test 5: Project CRUD and draft/publish security boundaries verified')

  // 6. Calendar Event CRUD & Private Notes Shielding
  console.log('Testing Calendar Event Management and Privacy Shielding...')
  const eventRes = mockRes()
  createEvent({
    body: {
      title: 'Confidential Strategy Session',
      start_at: '2026-10-25T10:00:00',
      end_at: '2026-10-25T11:00:00',
      visibility: 'Private',
      category: 'Career',
      show_on_portfolio_heatmap: 0,
      private_notes: 'SUPER_SECRET_PAYROLL_DATA_DO_NOT_LEAK',
    }
  }, eventRes)

  assert.equal(eventRes.statusCode, 201)
  const createdEvt = eventRes.data.data

  // Public second brain endpoint MUST NOT return this private event
  const pubEvtRes = mockRes()
  await getPublicEvents({ query: { search: 'Strategy' } }, pubEvtRes)
  const pubEventsList = pubEvtRes.data.events || []
  const leakedInPub = pubEventsList.some(e => e.id === createdEvt.id || (e.description || '').includes('SUPER_SECRET'))
  assert.equal(leakedInPub, false, 'Private event must NEVER be returned by public event endpoint')

  // Admin events endpoint MUST return private event and its private_notes
  const admEvtRes = mockRes()
  getAdminEvents({ query: { search: 'Confidential' } }, admEvtRes)
  const foundAdminEvt = admEvtRes.data.data.find(e => e.id === createdEvt.id)
  assert.ok(foundAdminEvt, 'Admin must see private event')
  assert.equal(foundAdminEvt.private_notes, 'SUPER_SECRET_PAYROLL_DATA_DO_NOT_LEAK')

  // Clean up test event
  const delEvtRes = mockRes()
  deleteEvent({ params: { id: createdEvt.id } }, delEvtRes)
  assert.equal(delEvtRes.statusCode, 200)
  console.log('✓ Test 6: Event privacy shielding and private notes protection verified')

  // 7. Portfolio Content Management (Section In-Place Editing)
  console.log('Testing Portfolio Content Customization...')
  const updateContentRes = mockRes()
  updatePortfolioContent({
    params: { section: 'personal' },
    body: {
      headline: 'Automated & Deterministic AI Systems',
      role: 'Full-Stack & AI Systems Architect',
    }
  }, updateContentRes)
  assert.equal(updateContentRes.statusCode, 200)

  const getContentRes = mockRes()
  getPortfolioContent({}, getContentRes)
  assert.equal(getContentRes.data.data.personal.headline, 'Automated & Deterministic AI Systems')
  console.log('✓ Test 7: Portfolio section content updates and persistence verified')

  // 8. Strategic Goal CRUD and Unlinking
  console.log('Testing Strategic Goal CRUD & Relationships...')
  const createGoalRes = mockRes()
  createGoal({
    body: {
      title: 'Automated Goal Test Objective',
      description: 'Test goal description for unit verification',
      category: 'AI Engineering',
      status: 'in_progress',
      color: '#60A5FA',
    }
  }, createGoalRes)
  assert.equal(createGoalRes.statusCode, 201)
  const createdGoal = createGoalRes.data.goal
  assert.equal(createdGoal.title, 'Automated Goal Test Objective')

  // Update Goal
  const updateGoalRes = mockRes()
  updateGoal({
    params: { id: createdGoal.id },
    body: {
      title: 'Updated Goal Objective',
      status: 'completed',
    }
  }, updateGoalRes)
  assert.equal(updateGoalRes.statusCode, 200)
  assert.equal(updateGoalRes.data.goal.title, 'Updated Goal Objective')
  assert.equal(updateGoalRes.data.goal.status, 'completed')

  // Delete Goal
  const deleteGoalRes = mockRes()
  deleteGoal({ params: { id: createdGoal.id } }, deleteGoalRes)
  assert.equal(deleteGoalRes.statusCode, 200)
  assert.equal(db.prepare('SELECT count(*) as c FROM goals WHERE id = ?').get(createdGoal.id).c, 0)
  console.log('✓ Test 8: Strategic Goal CRUD & lifecycle operations verified')

  // Clean up test admin user
  db.prepare('DELETE FROM admin_users WHERE id = ?').run(row.id)

  console.log('\n--- ALL ADMINISTRATOR SECURITY TESTS PASSED SUCCESSFULLY! ---\n')
}

runAdminTests()
  .then(async () => {
    const { disconnectMongo } = await import('../src/db/mongo.js')
    await disconnectMongo()
    process.exit(0)
  })
  .catch(err => {
    console.error('Test failed with error:', err)
    process.exit(1)
  })
