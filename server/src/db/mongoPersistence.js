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
  DsaAttemptModel,
  DsaRevisionScheduleModel,
  DsaMistakeJournalModel,
  DsaGameProfileModel,
  DsaAchievementUnlockModel,
  DsaDailyPlanModel,
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
 * Persist or update a DSA Attempt in MongoDB Atlas
 */
export async function persistAttemptToMongo(attempt) {
  if (!attempt || !attempt.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaAttemptModel.findOneAndUpdate(
      { id: attempt.id },
      {
        _id: attempt.id,
        id: attempt.id,
        problem_id: attempt.problem_id,
        attempt_number: attempt.attempt_number || 1,
        started_at: attempt.started_at || null,
        ended_at: attempt.ended_at || null,
        duration_seconds: attempt.duration_seconds != null ? attempt.duration_seconds : null,
        result: attempt.result,
        is_independent: attempt.is_independent !== undefined ? attempt.is_independent : 1,
        hints_used: attempt.hints_used || 0,
        solution_viewed: attempt.solution_viewed || 0,
        language: attempt.language || 'Java',
        confidence_rating: attempt.confidence_rating || 3,
        difficulty_experienced: attempt.difficulty_experienced || 'medium',
        notes: attempt.notes || '',
        source: attempt.source || 'practice_arena',
        xp_awarded: attempt.xp_awarded || 0,
        calendar_event_id: attempt.calendar_event_id || null,
        created_at: attempt.created_at || new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting attempt:', err.message)
  }
}

/**
 * Persist or update a Spaced Repetition Revision Schedule in MongoDB Atlas
 */
export async function persistRevisionToMongo(schedule) {
  if (!schedule || !schedule.problem_id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaRevisionScheduleModel.findOneAndUpdate(
      { problem_id: schedule.problem_id },
      {
        _id: schedule.problem_id,
        problem_id: schedule.problem_id,
        last_solved_at: schedule.last_solved_at,
        next_revision_due: schedule.next_revision_due,
        interval_days: schedule.interval_days || 3,
        repetition_count: schedule.repetition_count || 1,
        ease_factor: schedule.ease_factor || 2.5,
        status: schedule.status || 'due',
        updated_at: schedule.updated_at || new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting revision schedule:', err.message)
  }
}

/**
 * Persist or update a Mistake Journal entry in MongoDB Atlas
 */
export async function persistMistakeToMongo(mistake) {
  if (!mistake || !mistake.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaMistakeJournalModel.findOneAndUpdate(
      { id: mistake.id },
      {
        _id: mistake.id,
        id: mistake.id,
        problem_id: mistake.problem_id,
        attempt_id: mistake.attempt_id || null,
        category: mistake.category,
        mistake_description: mistake.mistake_description,
        lesson_learned: mistake.lesson_learned || '',
        created_at: mistake.created_at || new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting mistake:', err.message)
  }
}

/**
 * Delete a Mistake Journal entry from MongoDB Atlas
 */
export async function deleteMistakeFromMongo(mistakeId) {
  if (!mistakeId) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaMistakeJournalModel.deleteOne({ id: mistakeId })
  } catch (err) {
    console.error('[MongoDB Atlas] Error deleting mistake:', err.message)
  }
}

/**
 * Persist or update the Game Profile in MongoDB Atlas
 */
export async function persistGameProfileToMongo(profile) {
  if (!profile) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaGameProfileModel.findOneAndUpdate(
      { id: 'primary_user' },
      {
        _id: 'primary_user',
        id: 'primary_user',
        total_xp: profile.total_xp || 0,
        current_level: profile.current_level || 'Novice',
        current_streak: profile.current_streak || 0,
        longest_streak: profile.longest_streak || 0,
        last_active_date: profile.last_active_date || null,
        streak_freeze_count: profile.streak_freeze_count !== undefined ? profile.streak_freeze_count : 2,
        penalties_enabled: profile.penalties_enabled ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting game profile:', err.message)
  }
}

/**
 * Persist an Achievement Unlock in MongoDB Atlas
 */
export async function persistAchievementUnlockToMongo(achievementId, unlockedAt) {
  if (!achievementId) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaAchievementUnlockModel.findOneAndUpdate(
      { id: achievementId },
      {
        _id: achievementId,
        id: achievementId,
        is_unlocked: 1,
        unlocked_at: unlockedAt || new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting achievement unlock:', err.message)
  }
}

/**
 * Persist a Daily Practice Plan in MongoDB Atlas
 */
export async function persistDailyPlanToMongo(plan) {
  if (!plan || !plan.id) return
  try {
    if (!isMongoConnected()) await connectMongo()
    if (!isMongoConnected()) return

    await DsaDailyPlanModel.findOneAndUpdate(
      { id: plan.id },
      {
        _id: plan.id,
        id: plan.id,
        plan_date: plan.plan_date,
        duration_budget_minutes: plan.duration_budget_minutes || 45,
        summary: plan.summary || '',
        items_json: typeof plan.items_json === 'string' ? plan.items_json : JSON.stringify(plan.items || []),
        generated_by: plan.generated_by || 'deterministic',
        status: plan.status || 'active',
        calendar_event_id: plan.calendar_event_id || null,
        created_at: plan.created_at || new Date().toISOString(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  } catch (err) {
    console.error('[MongoDB Atlas] Error persisting daily plan:', err.message)
  }
}

/**
 * Bi-directional sync & hydration between MongoDB Atlas and SQLite
 * Ensures Render ephemeral containers never lose user data or resurrect deleted records!
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

      // Reconcile: Purge any goals from SQLite that were deleted in MongoDB
      const mongoGoalIdSet = new Set(mongoGoals.map((g) => g.id))
      const deleteSqliteGoal = sqliteDb.prepare('DELETE FROM goals WHERE id = ?')
      for (const g of sqliteGoals) {
        if (!mongoGoalIdSet.has(g.id)) {
          deleteSqliteGoal.run(g.id)
        }
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

      // Reconcile: Purge any projects from SQLite that were deleted in MongoDB so deletions stay deleted!
      const mongoProjIdSet = new Set(mongoProjects.map((p) => p.id))
      const deleteSqliteProject = sqliteDb.prepare('DELETE FROM projects WHERE id = ?')
      for (const p of sqliteProjects) {
        if (!mongoProjIdSet.has(p.id)) {
          deleteSqliteProject.run(p.id)
        }
      }
    } else if (sqliteProjects.length > 0) {
      for (const p of sqliteProjects) {
        await persistProjectToMongo(p)
      }
    }

    // 3. Sync Calendar Events (genuine user events)
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

      // Reconcile: Purge any events from SQLite that were deleted in MongoDB
      const mongoEventIdSet = new Set(mongoEvents.map((e) => e.id))
      const deleteSqliteEvent = sqliteDb.prepare('DELETE FROM events WHERE id = ?')
      for (const e of sqliteEvents) {
        if (!mongoEventIdSet.has(e.id)) {
          deleteSqliteEvent.run(e.id)
        }
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
      const mongoIdSet = new Set(mongoProblems.map((p) => p.id))
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

    // 6. Sync DSA User Attempts (Never lose solved questions on Render redeploy!)
    const mongoAttempts = await DsaAttemptModel.find().lean()
    const sqliteAttempts = sqliteDb.prepare('SELECT * FROM dsa_attempts').all()

    if (mongoAttempts.length > 0) {
      const upsertSqliteAttempt = sqliteDb.prepare(`
        INSERT INTO dsa_attempts (
          id, problem_id, attempt_number, started_at, ended_at, duration_seconds,
          result, is_independent, hints_used, solution_viewed, language,
          confidence_rating, difficulty_experienced, notes, source, xp_awarded,
          calendar_event_id, created_at
        ) VALUES (
          @id, @problem_id, @attempt_number, @started_at, @ended_at, @duration_seconds,
          @result, @is_independent, @hints_used, @solution_viewed, @language,
          @confidence_rating, @difficulty_experienced, @notes, @source, @xp_awarded,
          @calendar_event_id, @created_at
        )
        ON CONFLICT(id) DO UPDATE SET
          result = excluded.result,
          duration_seconds = excluded.duration_seconds,
          confidence_rating = excluded.confidence_rating,
          difficulty_experienced = excluded.difficulty_experienced,
          notes = excluded.notes,
          xp_awarded = excluded.xp_awarded
      `)

      for (const a of mongoAttempts) {
        upsertSqliteAttempt.run({
          id: a.id,
          problem_id: a.problem_id,
          attempt_number: a.attempt_number || 1,
          started_at: a.started_at || null,
          ended_at: a.ended_at || null,
          duration_seconds: a.duration_seconds != null ? a.duration_seconds : null,
          result: a.result || 'solved',
          is_independent: a.is_independent !== undefined ? a.is_independent : 1,
          hints_used: a.hints_used || 0,
          solution_viewed: a.solution_viewed || 0,
          language: a.language || 'Java',
          confidence_rating: a.confidence_rating || 3,
          difficulty_experienced: a.difficulty_experienced || 'medium',
          notes: a.notes || '',
          source: a.source || 'practice_arena',
          xp_awarded: a.xp_awarded || 0,
          calendar_event_id: a.calendar_event_id || null,
          created_at: a.created_at || new Date().toISOString(),
        })
      }

      // Reconcile: Purge any attempts from SQLite that were deleted in MongoDB so deletions stay deleted
      const mongoAttemptIdSet = new Set(mongoAttempts.map((a) => a.id))
      const deleteSqliteAttempt = sqliteDb.prepare('DELETE FROM dsa_attempts WHERE id = ?')
      for (const a of sqliteAttempts) {
        if (!mongoAttemptIdSet.has(a.id)) {
          deleteSqliteAttempt.run(a.id)
        }
      }
    } else if (sqliteAttempts.length > 0) {
      for (const a of sqliteAttempts) {
        await persistAttemptToMongo(a)
      }
    }

    // 7. Sync Spaced Repetition Revision Schedule
    const mongoRevisions = await DsaRevisionScheduleModel.find().lean()
    const sqliteRevisions = sqliteDb.prepare('SELECT * FROM dsa_revision_schedule').all()

    if (mongoRevisions.length > 0) {
      const upsertSqliteRevision = sqliteDb.prepare(`
        INSERT INTO dsa_revision_schedule (
          problem_id, last_solved_at, next_revision_due, interval_days, repetition_count, ease_factor, status, updated_at
        ) VALUES (
          @problem_id, @last_solved_at, @next_revision_due, @interval_days, @repetition_count, @ease_factor, @status, @updated_at
        )
        ON CONFLICT(problem_id) DO UPDATE SET
          last_solved_at = excluded.last_solved_at,
          next_revision_due = excluded.next_revision_due,
          interval_days = excluded.interval_days,
          repetition_count = excluded.repetition_count,
          ease_factor = excluded.ease_factor,
          status = excluded.status,
          updated_at = excluded.updated_at
      `)

      for (const r of mongoRevisions) {
        upsertSqliteRevision.run({
          problem_id: r.problem_id,
          last_solved_at: r.last_solved_at,
          next_revision_due: r.next_revision_due,
          interval_days: r.interval_days || 3,
          repetition_count: r.repetition_count || 1,
          ease_factor: r.ease_factor || 2.5,
          status: r.status || 'due',
          updated_at: r.updated_at || new Date().toISOString(),
        })
      }

      // Reconcile: Purge any revision schedules from SQLite that were deleted in MongoDB
      const mongoRevProblemSet = new Set(mongoRevisions.map((r) => r.problem_id))
      const deleteSqliteRev = sqliteDb.prepare('DELETE FROM dsa_revision_schedule WHERE problem_id = ?')
      for (const r of sqliteRevisions) {
        if (!mongoRevProblemSet.has(r.problem_id)) {
          deleteSqliteRev.run(r.problem_id)
        }
      }
    } else if (sqliteRevisions.length > 0) {
      for (const r of sqliteRevisions) {
        await persistRevisionToMongo(r)
      }
    }

    // 8. Sync Mistake Journal
    const mongoMistakes = await DsaMistakeJournalModel.find().lean()
    const sqliteMistakes = sqliteDb.prepare('SELECT * FROM dsa_mistake_journal').all()

    if (mongoMistakes.length > 0) {
      const upsertSqliteMistake = sqliteDb.prepare(`
        INSERT INTO dsa_mistake_journal (
          id, problem_id, attempt_id, category, mistake_description, lesson_learned, created_at
        ) VALUES (
          @id, @problem_id, @attempt_id, @category, @mistake_description, @lesson_learned, @created_at
        )
        ON CONFLICT(id) DO UPDATE SET
          category = excluded.category,
          mistake_description = excluded.mistake_description,
          lesson_learned = excluded.lesson_learned
      `)

      for (const m of mongoMistakes) {
        upsertSqliteMistake.run({
          id: m.id,
          problem_id: m.problem_id,
          attempt_id: m.attempt_id || null,
          category: m.category,
          mistake_description: m.mistake_description,
          lesson_learned: m.lesson_learned || '',
          created_at: m.created_at || new Date().toISOString(),
        })
      }

      // Reconcile: Purge any mistakes from SQLite that were deleted in MongoDB
      const mongoMistakeIdSet = new Set(mongoMistakes.map((m) => m.id))
      const deleteSqliteMistake = sqliteDb.prepare('DELETE FROM dsa_mistake_journal WHERE id = ?')
      for (const m of sqliteMistakes) {
        if (!mongoMistakeIdSet.has(m.id)) {
          deleteSqliteMistake.run(m.id)
        }
      }
    } else if (sqliteMistakes.length > 0) {
      for (const m of sqliteMistakes) {
        await persistMistakeToMongo(m)
      }
    }

    // 9. Sync Game Profile (XP, Level, Streaks)
    const mongoProfile = await DsaGameProfileModel.findOne({ id: 'primary_user' }).lean()
    const sqliteProfile = sqliteDb.prepare('SELECT * FROM dsa_game_profile WHERE id = ?').get('primary_user')

    if (mongoProfile) {
      sqliteDb.prepare(`
        INSERT INTO dsa_game_profile (
          id, total_xp, current_level, current_streak, longest_streak,
          last_active_date, streak_freeze_count, penalties_enabled, created_at, updated_at
        ) VALUES (
          @id, @total_xp, @current_level, @current_streak, @longest_streak,
          @last_active_date, @streak_freeze_count, @penalties_enabled, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          total_xp = excluded.total_xp,
          current_level = excluded.current_level,
          current_streak = excluded.current_streak,
          longest_streak = excluded.longest_streak,
          last_active_date = excluded.last_active_date,
          streak_freeze_count = excluded.streak_freeze_count,
          penalties_enabled = excluded.penalties_enabled,
          updated_at = excluded.updated_at
      `).run({
        id: 'primary_user',
        total_xp: mongoProfile.total_xp || 0,
        current_level: mongoProfile.current_level || 'Novice',
        current_streak: mongoProfile.current_streak || 0,
        longest_streak: mongoProfile.longest_streak || 0,
        last_active_date: mongoProfile.last_active_date || null,
        streak_freeze_count: mongoProfile.streak_freeze_count !== undefined ? mongoProfile.streak_freeze_count : 2,
        penalties_enabled: mongoProfile.penalties_enabled ? 1 : 0,
        created_at: mongoProfile.created_at || new Date().toISOString(),
        updated_at: mongoProfile.updated_at || new Date().toISOString(),
      })
    } else if (sqliteProfile) {
      await persistGameProfileToMongo(sqliteProfile)
    }

    // 10. Sync Achievement Unlocks
    const mongoUnlocks = await DsaAchievementUnlockModel.find({ is_unlocked: 1 }).lean()
    const sqliteUnlocked = sqliteDb.prepare('SELECT * FROM dsa_achievements WHERE is_unlocked = 1').all()

    if (mongoUnlocks.length > 0) {
      const unlockStmt = sqliteDb.prepare(`
        UPDATE dsa_achievements
        SET is_unlocked = 1, unlocked_at = ?
        WHERE id = ?
      `)
      for (const u of mongoUnlocks) {
        unlockStmt.run(u.unlocked_at || new Date().toISOString(), u.id)
      }

      const mongoUnlockIdSet = new Set(mongoUnlocks.map((u) => u.id))
      for (const a of sqliteUnlocked) {
        if (!mongoUnlockIdSet.has(a.id)) {
          await persistAchievementUnlockToMongo(a.id, a.unlocked_at)
        }
      }
    } else if (sqliteUnlocked.length > 0) {
      for (const a of sqliteUnlocked) {
        await persistAchievementUnlockToMongo(a.id, a.unlocked_at)
      }
    }

    // 11. Sync Daily Plans
    const mongoPlans = await DsaDailyPlanModel.find().lean()
    const sqlitePlans = sqliteDb.prepare('SELECT * FROM dsa_daily_plans').all()

    if (mongoPlans.length > 0) {
      const upsertSqlitePlan = sqliteDb.prepare(`
        INSERT INTO dsa_daily_plans (
          id, plan_date, duration_budget_minutes, summary, items_json, generated_by, status, calendar_event_id, created_at
        ) VALUES (
          @id, @plan_date, @duration_budget_minutes, @summary, @items_json, @generated_by, @status, @calendar_event_id, @created_at
        )
        ON CONFLICT(id) DO UPDATE SET
          summary = excluded.summary,
          items_json = excluded.items_json,
          status = excluded.status
      `)

      for (const p of mongoPlans) {
        upsertSqlitePlan.run({
          id: p.id,
          plan_date: p.plan_date,
          duration_budget_minutes: p.duration_budget_minutes || 45,
          summary: p.summary || '',
          items_json: typeof p.items_json === 'string' ? p.items_json : JSON.stringify(p.items_json || []),
          generated_by: p.generated_by || 'deterministic',
          status: p.status || 'active',
          calendar_event_id: p.calendar_event_id || null,
          created_at: p.created_at || new Date().toISOString(),
        })
      }
    } else if (sqlitePlans.length > 0) {
      for (const p of sqlitePlans) {
        await persistDailyPlanToMongo(p)
      }
    }

    console.log('[MongoDB Atlas] Dual sync & cloud hydration complete. Data safely persisted.')
    return true
  } catch (err) {
    console.error('[MongoDB Atlas Sync Error]', err.message)
    return false
  }
}

