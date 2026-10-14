import { isMongoConnected, connectMongo } from './mongo.js'
import { getDatabase } from './database.js'
import {
  GoalModel,
  ProjectModel,
  EventModel,
  PortfolioContentModel,
  AdminUserModel,
  SessionModel,
  LoginAttemptModel,
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

/**
 * Persist or update a Strategic Goal in MongoDB Atlas
 */
export async function persistGoalToMongo(goal) {
  if (!goal || !goal.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await GoalModel.findOneAndUpdate(
      { id: goal.id },
      {
        _id: goal.id,
        id: goal.id,
        title: goal.title,
        description: goal.description || '',
        category: goal.category || 'AI Engineering',
        status: goal.status || 'in_progress',
        target_date: goal.target_date || '',
        color: goal.color || '#B8FF3C',
        created_at: goal.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting goal:', err.message)
  }
}

/**
 * Delete a Strategic Goal from MongoDB Atlas
 */
export async function deleteGoalFromMongo(goalId) {
  if (!goalId) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await GoalModel.deleteOne({ id: goalId })
    // Unlink goal from any projects and events
    await ProjectModel.updateMany({ goal_id: goalId }, { $set: { goal_id: null } })
    await EventModel.updateMany({ goal_id: goalId }, { $set: { goal_id: null } })
  } catch (err) {
    console.error('[MongoDB Atlas] Error deleting goal:', err.message)
  }
}

/**
 * Persist or update a Project in MongoDB Atlas
 */
export async function persistProjectToMongo(project) {
  if (!project || !project.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await ProjectModel.findOneAndUpdate(
      { id: project.id },
      {
        _id: project.id,
        id: project.id,
        title: project.title,
        description: project.description || '',
        short_description: project.short_description || '',
        outcome: project.outcome || '',
        problem: project.problem || '',
        architecture: project.architecture || '',
        key_challenge: project.key_challenge || '',
        solution: project.solution || '',
        metrics: Array.isArray(project.metrics) ? project.metrics : safeJsonParse(project.metrics, []),
        category: project.category || 'AI / Automation',
        status: project.status || 'active',
        tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : safeJsonParse(project.tech_stack, []),
        live_link: project.live_link || '',
        github_link: project.github_link || '',
        image: project.image || '',
        featured: project.featured ? 1 : 0,
        reflection: project.reflection || '',
        is_published: project.is_published !== undefined ? project.is_published : 1,
        display_order: project.display_order || 0,
        goal_id: project.goal_id || null,
        created_at: project.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting project:', err.message)
  }
}

/**
 * Delete a Project from MongoDB Atlas
 */
export async function deleteProjectFromMongo(projectId) {
  if (!projectId) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await ProjectModel.deleteOne({ id: projectId })
    await EventModel.updateMany({ project_id: projectId }, { $set: { project_id: null } })
  } catch (err) {
    console.error('[MongoDB Atlas] Error deleting project:', err.message)
  }
}

/**
 * Persist or update a Calendar Event in MongoDB Atlas
 */
export async function persistEventToMongo(event) {
  if (!event || !event.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await EventModel.findOneAndUpdate(
      { id: event.id },
      {
        _id: event.id,
        id: event.id,
        title: event.title,
        description: event.description || '',
        category: event.category || 'Learning',
        start_at: event.start_at,
        end_at: event.end_at,
        all_day: event.all_day ? 1 : 0,
        timezone: event.timezone || 'Asia/Kolkata',
        location: event.location || '',
        meeting_url: event.meeting_url || '',
        external_url: event.external_url || '',
        status: event.status || 'Planned',
        visibility: event.visibility || 'Private',
        show_on_portfolio_heatmap: event.show_on_portfolio_heatmap ? 1 : 0,
        color: event.color || null,
        tags: Array.isArray(event.tags) ? event.tags : safeJsonParse(event.tags, []),
        priority: event.priority || 'medium',
        goal_id: event.goal_id || null,
        project_id: event.project_id || null,
        private_notes: event.private_notes || '',
        created_at: event.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting event:', err.message)
  }
}

/**
 * Delete a Calendar Event from MongoDB Atlas
 */
export async function deleteEventFromMongo(eventId) {
  if (!eventId) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await EventModel.deleteOne({ id: eventId })
  } catch (err) {
    console.error('[MongoDB Atlas] Error deleting event:', err.message)
  }
}

/**
 * Persist Portfolio Content in MongoDB Atlas
 */
export async function persistPortfolioContentToMongo(sectionKey, contentJson) {
  if (!sectionKey) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await PortfolioContentModel.findOneAndUpdate(
      { section_key: sectionKey },
      {
        _id: sectionKey,
        section_key: sectionKey,
        content_json: typeof contentJson === 'string' ? safeJsonParse(contentJson, {}) : contentJson,
        updated_at: new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting portfolio content:', err.message)
  }
}

/**
 * Persist or update a DSA Problem in MongoDB Atlas
 */
export async function persistProblemToMongo(problem) {
  if (!problem || !problem.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaProblemModel.findOneAndUpdate(
      { id: problem.id },
      {
        _id: problem.id,
        id: problem.id,
        platform: problem.platform || 'leetcode',
        platform_problem_id: problem.platform_problem_id || null,
        title: problem.title,
        slug: problem.slug,
        canonical_url: problem.canonical_url,
        difficulty: problem.difficulty || 'Medium',
        primary_topic: problem.primary_topic || 'Arrays',
        secondary_topics: Array.isArray(problem.secondary_topics) ? problem.secondary_topics : safeJsonParse(problem.secondary_topics, []),
        patterns: Array.isArray(problem.patterns) ? problem.patterns : safeJsonParse(problem.patterns, []),
        is_free: problem.is_free !== undefined ? problem.is_free : 1,
        access_status: problem.access_status || 'free',
        estimated_solve_time: problem.estimated_solve_time || 25,
        acceptance_rate: problem.acceptance_rate || null,
        source: problem.source || 'curated_catalog',
        created_at: problem.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting DSA problem:', err.message)
  }
}

/**
 * Bi-directional sync & hydration between MongoDB Atlas and SQLite
 * Ensures Render ephemeral containers never lose user data!
 */
export async function syncMongoAndSqlite() {
  const conn = await connectMongo()
  if (!conn) {
    console.warn('[Mongo Sync] MongoDB Atlas connection unavailable. Running in local mode.')
    return false
  }

  const sqliteDb = getDatabase()

  try {
    // 1. Sync Goals: Hydrate SQLite from Mongo if Mongo has records, otherwise seed Mongo from SQLite
    const mongoGoals = await GoalModel.find().lean()
    const sqliteGoals = sqliteDb.prepare('SELECT * FROM goals').all()

    if (mongoGoals.length > 0) {
      // Hydrate SQLite from MongoDB Atlas (cloud is source of truth)
      const upsertSqliteGoal = sqliteDb.prepare(`
        INSERT INTO goals (id, title, description, category, status, target_date, color, created_at, updated_at)
        VALUES (@id, @title, @description, @category, @status, @target_date, @color, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          status = excluded.status,
          target_date = excluded.target_date,
          color = excluded.color,
          updated_at = excluded.updated_at
      `)
      for (const g of mongoGoals) {
        upsertSqliteGoal.run({
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
      }
    } else if (sqliteGoals.length > 0) {
      // Seed Mongo from SQLite
      for (const g of sqliteGoals) {
        await persistGoalToMongo(g)
      }
    }

    // 2. Sync Projects
    const mongoProjects = await ProjectModel.find().lean()
    const sqliteProjects = sqliteDb.prepare('SELECT * FROM projects').all()

    if (mongoProjects.length > 0) {
      const upsertSqliteProject = sqliteDb.prepare(`
        INSERT INTO projects (
          id, title, description, short_description, outcome, problem,
          architecture, key_challenge, solution, metrics, category, status,
          tech_stack, live_link, github_link, image, featured, reflection,
          is_published, display_order, goal_id, created_at, updated_at
        ) VALUES (
          @id, @title, @description, @short_description, @outcome, @problem,
          @architecture, @key_challenge, @solution, @metrics, @category, @status,
          @tech_stack, @live_link, @github_link, @image, @featured, @reflection,
          @is_published, @display_order, @goal_id, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          short_description = excluded.short_description,
          outcome = excluded.outcome,
          problem = excluded.problem,
          architecture = excluded.architecture,
          key_challenge = excluded.key_challenge,
          solution = excluded.solution,
          metrics = excluded.metrics,
          category = excluded.category,
          status = excluded.status,
          tech_stack = excluded.tech_stack,
          live_link = excluded.live_link,
          github_link = excluded.github_link,
          image = excluded.image,
          featured = excluded.featured,
          reflection = excluded.reflection,
          is_published = excluded.is_published,
          display_order = excluded.display_order,
          goal_id = excluded.goal_id,
          updated_at = excluded.updated_at
      `)

      for (const p of mongoProjects) {
        upsertSqliteProject.run({
          id: p.id,
          title: p.title,
          description: p.description || '',
          short_description: p.short_description || '',
          outcome: p.outcome || '',
          problem: p.problem || '',
          architecture: p.architecture || '',
          key_challenge: p.key_challenge || '',
          solution: p.solution || '',
          metrics: JSON.stringify(Array.isArray(p.metrics) ? p.metrics : []),
          category: p.category || 'AI / Automation',
          status: p.status || 'active',
          tech_stack: JSON.stringify(Array.isArray(p.tech_stack) ? p.tech_stack : []),
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
      }
    } else if (sqliteProjects.length > 0) {
      for (const p of sqliteProjects) {
        await persistProjectToMongo(p)
      }
    }

    // 3. Sync Calendar Events (Only genuine user events)
    const mongoEvents = await EventModel.find().lean()
    const sqliteEvents = sqliteDb.prepare('SELECT * FROM events').all()

    if (mongoEvents.length > 0) {
      const upsertSqliteEvent = sqliteDb.prepare(`
        INSERT INTO events (
          id, title, description, category, start_at, end_at, all_day, timezone,
          location, meeting_url, external_url, status, visibility,
          show_on_portfolio_heatmap, color, tags, priority, goal_id, project_id,
          private_notes, created_at, updated_at
        ) VALUES (
          @id, @title, @description, @category, @start_at, @end_at, @all_day, @timezone,
          @location, @meeting_url, @external_url, @status, @visibility,
          @show_on_portfolio_heatmap, @color, @tags, @priority, @goal_id, @project_id,
          @private_notes, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          start_at = excluded.start_at,
          end_at = excluded.end_at,
          all_day = excluded.all_day,
          timezone = excluded.timezone,
          location = excluded.location,
          meeting_url = excluded.meeting_url,
          external_url = excluded.external_url,
          status = excluded.status,
          visibility = excluded.visibility,
          show_on_portfolio_heatmap = excluded.show_on_portfolio_heatmap,
          color = excluded.color,
          tags = excluded.tags,
          priority = excluded.priority,
          goal_id = excluded.goal_id,
          project_id = excluded.project_id,
          private_notes = excluded.private_notes,
          updated_at = excluded.updated_at
      `)

      for (const e of mongoEvents) {
        upsertSqliteEvent.run({
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
          tags: JSON.stringify(Array.isArray(e.tags) ? e.tags : []),
          priority: e.priority || 'medium',
          goal_id: e.goal_id || null,
          project_id: e.project_id || null,
          private_notes: e.private_notes || '',
          created_at: e.created_at || new Date().toISOString(),
          updated_at: e.updated_at || new Date().toISOString(),
        })
      }
    } else if (sqliteEvents.length > 0) {
      for (const e of sqliteEvents) {
        await persistEventToMongo(e)
      }
    }

    // 4. Sync Portfolio Content
    const mongoContent = await PortfolioContentModel.find().lean()
    if (mongoContent.length > 0) {
      const upsertSqliteContent = sqliteDb.prepare(`
        INSERT INTO portfolio_content (section_key, content_json, updated_at)
        VALUES (@section_key, @content_json, @updated_at)
        ON CONFLICT(section_key) DO UPDATE SET
          content_json = excluded.content_json,
          updated_at = excluded.updated_at
      `)
      for (const c of mongoContent) {
        upsertSqliteContent.run({
          section_key: c.section_key,
          content_json: JSON.stringify(c.content_json || {}),
          updated_at: c.updated_at || new Date().toISOString(),
        })
      }
    }

    // 5. Sync DSA Problems
    const mongoProblems = await DsaProblemModel.find().lean()
    const sqliteProblems = sqliteDb.prepare('SELECT * FROM dsa_problems').all()

    if (mongoProblems.length > 0) {
      const upsertSqliteProblem = sqliteDb.prepare(`
        INSERT INTO dsa_problems (
          id, platform, platform_problem_id, title, slug, canonical_url,
          difficulty, primary_topic, secondary_topics, patterns,
          is_free, access_status, estimated_solve_time, acceptance_rate, source,
          created_at, updated_at
        ) VALUES (
          @id, @platform, @platform_problem_id, @title, @slug, @canonical_url,
          @difficulty, @primary_topic, @secondary_topics, @patterns,
          @is_free, @access_status, @estimated_solve_time, @acceptance_rate, @source,
          @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          slug = excluded.slug,
          canonical_url = excluded.canonical_url,
          difficulty = excluded.difficulty,
          primary_topic = excluded.primary_topic,
          secondary_topics = excluded.secondary_topics,
          patterns = excluded.patterns,
          is_free = excluded.is_free,
          access_status = excluded.access_status,
          updated_at = excluded.updated_at
      `)

      for (const p of mongoProblems) {
        upsertSqliteProblem.run({
          id: p.id,
          platform: p.platform || 'leetcode',
          platform_problem_id: p.platform_problem_id || null,
          title: p.title,
          slug: p.slug,
          canonical_url: p.canonical_url,
          difficulty: p.difficulty || 'Medium',
          primary_topic: p.primary_topic || 'Arrays',
          secondary_topics: JSON.stringify(Array.isArray(p.secondary_topics) ? p.secondary_topics : []),
          patterns: JSON.stringify(Array.isArray(p.patterns) ? p.patterns : []),
          is_free: p.is_free !== undefined ? p.is_free : 1,
          access_status: p.access_status || 'free',
          estimated_solve_time: p.estimated_solve_time || 25,
          acceptance_rate: p.acceptance_rate || null,
          source: p.source || 'curated_catalog',
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        })
      }
      const mongoIdSet = new Set(mongoProblems.map(p => p.id))
      for (const p of sqliteProblems) {
        if (!mongoIdSet.has(p.id)) {
          await persistProblemToMongo(p)
        }
      }
    } else if (sqliteProblems.length > 0) {
      for (const p of sqliteProblems) {
        await persistProblemToMongo(p)
      }
    }

    console.log('[MongoDB Atlas] Dual sync & cloud hydration complete. Data safely persisted.')
    return true
  } catch (err) {
    console.error('[MongoDB Atlas Sync Error]', err.message)
    return false
  }
}
