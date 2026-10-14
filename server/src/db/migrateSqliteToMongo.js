import { connectMongo, isMongoConnected } from './mongo.js'
import { getDatabase } from './database.js'
import {
  GoalModel,
  ProjectModel,
  EventModel,
  PortfolioContentModel,
  AdminUserModel,
  DsaProblemModel,
} from '../models/index.js'

function safeJsonParse(val, fallback = []) {
  if (!val) return fallback
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

export async function syncSqliteToMongo() {
  const conn = await connectMongo()
  if (!conn) {
    console.warn('[Mongo Sync] MongoDB Atlas not connected. Skipping initial migration.')
    return { success: false, reason: 'No Mongo Connection' }
  }

  const sqliteDb = getDatabase()

  try {
    // 1. Sync Goals
    const sqliteGoals = sqliteDb.prepare('SELECT * FROM goals').all()
    let goalsMigrated = 0
    for (const g of sqliteGoals) {
      const exists = await GoalModel.findOne({ id: g.id })
      if (!exists) {
        await GoalModel.create({
          _id: g.id,
          id: g.id,
          title: g.title,
          description: g.description || '',
          category: g.category || 'AI Engineering',
          status: g.status || 'in_progress',
          target_date: g.target_date || '',
          color: g.color || '#B8FF3C',
          created_at: g.created_at || new Date().toISOString(),
          updated_at: g.updated_at || new Date().toISOString(),
        })
        goalsMigrated++
      }
    }

    // 2. Sync Projects
    const sqliteProjects = sqliteDb.prepare('SELECT * FROM projects').all()
    let projectsMigrated = 0
    for (const p of sqliteProjects) {
      const exists = await ProjectModel.findOne({ id: p.id })
      if (!exists) {
        await ProjectModel.create({
          _id: p.id,
          id: p.id,
          title: p.title,
          description: p.description || '',
          short_description: p.short_description || '',
          outcome: p.outcome || '',
          problem: p.problem || '',
          architecture: p.architecture || '',
          key_challenge: p.key_challenge || '',
          solution: p.solution || '',
          metrics: safeJsonParse(p.metrics, []),
          category: p.category || 'AI / Automation',
          status: p.status || 'active',
          tech_stack: safeJsonParse(p.tech_stack, []),
          live_link: p.live_link || '',
          github_link: p.github_link || '',
          image: p.image || '',
          featured: p.featured ? 1 : 0,
          reflection: p.reflection || '',
          is_published: p.is_published !== undefined ? p.is_published : 1,
          display_order: p.display_order || 0,
          goal_id: p.goal_id || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        })
        projectsMigrated++
      }
    }

    // 3. Sync Calendar Events (Only the genuine user events exist in SQLite)
    const sqliteEvents = sqliteDb.prepare('SELECT * FROM events').all()
    let eventsMigrated = 0
    for (const e of sqliteEvents) {
      const exists = await EventModel.findOne({ id: e.id })
      if (!exists) {
        await EventModel.create({
          _id: e.id,
          id: e.id,
          title: e.title,
          description: e.description || '',
          category: e.category || 'Learning',
          start_at: e.start_at,
          end_at: e.end_at,
          all_day: e.all_day ? 1 : 0,
          timezone: e.timezone || 'Asia/Kolkata',
          location: e.location || '',
          meeting_url: e.meeting_url || '',
          external_url: e.external_url || '',
          status: e.status || 'Planned',
          visibility: e.visibility || 'Private',
          show_on_portfolio_heatmap: e.show_on_portfolio_heatmap ? 1 : 0,
          color: e.color || null,
          tags: safeJsonParse(e.tags, []),
          priority: e.priority || 'medium',
          goal_id: e.goal_id || null,
          project_id: e.project_id || null,
          private_notes: e.private_notes || '',
          created_at: e.created_at || new Date().toISOString(),
          updated_at: e.updated_at || new Date().toISOString(),
        })
        eventsMigrated++
      }
    }

    // 4. Sync Portfolio Content
    const sqliteContent = sqliteDb.prepare('SELECT * FROM portfolio_content').all()
    let contentMigrated = 0
    for (const c of sqliteContent) {
      const exists = await PortfolioContentModel.findOne({ section_key: c.section_key })
      if (!exists) {
        await PortfolioContentModel.create({
          _id: c.section_key,
          section_key: c.section_key,
          content_json: safeJsonParse(c.content_json, {}),
          updated_at: c.updated_at || new Date().toISOString(),
        })
        contentMigrated++
      }
    }

    // 5. Sync Admin Users
    const sqliteAdmins = sqliteDb.prepare('SELECT * FROM admin_users').all()
    let adminsMigrated = 0
    for (const a of sqliteAdmins) {
      const exists = await AdminUserModel.findOne({ username: a.username })
      if (!exists) {
        await AdminUserModel.create({
          _id: a.id,
          id: a.id,
          username: a.username,
          password_hash: a.password_hash,
          salt: a.salt,
          created_at: a.created_at || new Date().toISOString(),
          updated_at: a.updated_at || new Date().toISOString(),
        })
        adminsMigrated++
      }
    }

    // 6. Sync DSA Problems
    const sqliteProblems = sqliteDb.prepare('SELECT * FROM dsa_problems').all()
    let problemsMigrated = 0
    for (const p of sqliteProblems) {
      const exists = await DsaProblemModel.findOne({ id: p.id })
      if (!exists) {
        await DsaProblemModel.create({
          _id: p.id,
          id: p.id,
          platform: p.platform || 'leetcode',
          platform_problem_id: p.platform_problem_id || null,
          title: p.title,
          slug: p.slug,
          canonical_url: p.canonical_url,
          difficulty: p.difficulty || 'Medium',
          primary_topic: p.primary_topic || 'Arrays',
          secondary_topics: safeJsonParse(p.secondary_topics, []),
          patterns: safeJsonParse(p.patterns, []),
          is_free: p.is_free !== undefined ? p.is_free : 1,
          access_status: p.access_status || 'free',
          estimated_solve_time: p.estimated_solve_time || 25,
          acceptance_rate: p.acceptance_rate || null,
          source: p.source || 'curated_catalog',
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        })
        problemsMigrated++
      }
    }

    console.log(
      `[Mongo Migration Complete] Goals: +${goalsMigrated}, Projects: +${projectsMigrated}, Events: +${eventsMigrated}, Content: +${contentMigrated}, Admins: +${adminsMigrated}, Problems: +${problemsMigrated}`
    )

    return {
      success: true,
      goalsMigrated,
      projectsMigrated,
      eventsMigrated,
      contentMigrated,
      adminsMigrated,
      problemsMigrated,
    }
  } catch (err) {
    console.error('[Mongo Migration Error]', err)
    return { success: false, error: err.message }
  }
}

// Allow direct CLI execution: node src/db/migrateSqliteToMongo.js
if (process.argv[1] && process.argv[1].endsWith('migrateSqliteToMongo.js')) {
  syncSqliteToMongo().then((res) => {
    console.log('Result:', res)
    process.exit(res.success ? 0 : 1)
  })
}
