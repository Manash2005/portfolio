import crypto from 'node:crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/database.js'
import { getPortfolioDataFallback } from '../db/seedInitialData.js'
import {
  persistGoalToMongo,
  deleteGoalFromMongo,
  persistProjectToMongo,
  deleteProjectFromMongo,
  persistEventToMongo,
  deleteEventFromMongo,
  persistPortfolioContentToMongo,
} from '../db/mongoPersistence.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Load fallback data from client JSON file or server backup
 */
function getJsonFallback() {
  return getPortfolioDataFallback() || {}
}

/**
 * Seed or backfill projects from JSON if columns are empty
 */
export function ensureProjectsPopulated() {
  try {
    const fallback = getJsonFallback()
    if (!fallback.projects || !Array.isArray(fallback.projects)) return

    const updateProject = db.prepare(`
      UPDATE projects SET
        short_description = COALESCE(short_description, @short_description),
        outcome = COALESCE(outcome, @outcome),
        problem = COALESCE(problem, @problem),
        architecture = COALESCE(architecture, @architecture),
        key_challenge = COALESCE(key_challenge, @key_challenge),
        solution = COALESCE(solution, @solution),
        metrics = COALESCE(metrics, @metrics),
        image = COALESCE(image, @image),
        featured = COALESCE(featured, @featured),
        reflection = COALESCE(reflection, @reflection),
        is_published = COALESCE(is_published, 1),
        display_order = COALESCE(display_order, @display_order)
      WHERE title = @title
    `)

    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects (
        id, title, description, short_description, outcome, problem,
        architecture, key_challenge, solution, metrics, category, status,
        tech_stack, live_link, github_link, image, featured, reflection,
        is_published, display_order, goal_id
      ) VALUES (
        @id, @title, @description, @short_description, @outcome, @problem,
        @architecture, @key_challenge, @solution, @metrics, @category, @status,
        @tech_stack, @live_link, @github_link, @image, @featured, @reflection,
        @is_published, @display_order, @goal_id
      )
    `)

    fallback.projects.forEach((proj, idx) => {
      const id = 'proj_' + (proj.title || `project_${idx}`).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32)
      const data = {
        id,
        title: proj.title,
        description: proj.short_description || proj.problem || '',
        short_description: proj.short_description || '',
        outcome: proj.outcome || '',
        problem: proj.problem || '',
        architecture: proj.architecture || '',
        key_challenge: proj.key_challenge || '',
        solution: proj.solution || '',
        metrics: JSON.stringify(proj.metrics || []),
        category: proj.category || 'AI / Automation',
        status: 'completed',
        tech_stack: JSON.stringify(proj.techStack || []),
        live_link: proj.liveLink || null,
        github_link: proj.githubLink || null,
        image: proj.image || null,
        featured: proj.featured ? 1 : 0,
        reflection: proj.reflection || '',
        is_published: 1,
        display_order: idx,
        goal_id: proj.category?.includes('AI') ? 'goal_ai_eng' : 'goal_projects_shipping',
      }

      insertProject.run(data)
      updateProject.run(data)
    })
  } catch (err) {
    console.error('Error populating projects:', err)
  }
}

// Run initial backfill on controller load
ensureProjectsPopulated()

/* ==========================================================================
   PORTFOLIO CONTENT CONTROLLERS (Site bio, skills, contact, education)
   ========================================================================== */

/**
 * GET /api/portfolio/content
 * Returns entire portfolio content merged from DB and JSON fallback
 */
export function getPortfolioContent(req, res) {
  try {
    const fallback = getJsonFallback()
    const rows = db.prepare('SELECT section_key, content_json FROM portfolio_content').all()

    const contentMap = {}
    rows.forEach(r => {
      try {
        contentMap[r.section_key] = JSON.parse(r.content_json)
      } catch {
        contentMap[r.section_key] = r.content_json
      }
    })

    const response = {
      personal: { ...(fallback.personal || {}), ...(contentMap.personal || {}) },
      skills: { ...(fallback.skills || {}), ...(contentMap.skills || {}) },
      stats: { ...(fallback.stats || {}), ...(contentMap.stats || {}) },
      contact: { ...(fallback.contact || {}), ...(contentMap.contact || {}) },
    }

    res.json({ success: true, data: response })
  } catch (err) {
    console.error('Error fetching portfolio content:', err)
    res.status(500).json({ success: false, error: 'Failed to retrieve content' })
  }
}

/**
 * PATCH /api/v1/admin/content/:section
 * Updates a content section (e.g. personal, skills, contact)
 */
export function updatePortfolioContent(req, res) {
  const { section } = req.params
  const validSections = ['personal', 'skills', 'stats', 'contact']

  if (!validSections.includes(section)) {
    return res.status(400).json({ success: false, error: `Invalid section: ${section}` })
  }

  const newContent = req.body
  if (!newContent || typeof newContent !== 'object') {
    return res.status(400).json({ success: false, error: 'Request body must be a valid JSON object' })
  }

  try {
    const jsonStr = JSON.stringify(newContent)
    db.prepare(`
      INSERT INTO portfolio_content (section_key, content_json, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(section_key) DO UPDATE SET
        content_json = excluded.content_json,
        updated_at = datetime('now')
    `).run(section, jsonStr)

    persistPortfolioContentToMongo(section, newContent).catch(() => {})

    res.json({
      success: true,
      message: `Section ${section} updated successfully`,
      data: newContent,
    })
  } catch (err) {
    console.error('Error updating content:', err)
    res.status(500).json({ success: false, error: 'Database update failed' })
  }
}

/* ==========================================================================
   PROJECTS CRUD CONTROLLERS
   ========================================================================== */

function formatProjectRow(row) {
  return {
    ...row,
    techStack: row.tech_stack ? JSON.parse(row.tech_stack) : [],
    metrics: row.metrics ? JSON.parse(row.metrics) : [],
    featured: Boolean(row.featured),
    is_published: Boolean(row.is_published),
    liveLink: row.live_link,
    githubLink: row.github_link,
  }
}

/**
 * GET /api/portfolio/projects
 * Public endpoint returning published projects sorted by display_order
 */
export function getPublicProjects(req, res) {
  try {
    const projects = db.prepare(`
      SELECT * FROM projects
      WHERE is_published = 1
      ORDER BY display_order ASC, created_at DESC
    `).all().map(formatProjectRow)

    res.json({ success: true, count: projects.length, data: projects })
  } catch (err) {
    console.error('Error fetching public projects:', err)
    res.status(500).json({ success: false, error: 'Failed to retrieve projects' })
  }
}

/**
 * GET /api/v1/admin/projects
 * Admin endpoint returning all projects (including drafts/unpublished)
 */
export function getAdminProjects(req, res) {
  try {
    const projects = db.prepare(`
      SELECT * FROM projects
      ORDER BY display_order ASC, created_at DESC
    `).all().map(formatProjectRow)

    res.json({ success: true, count: projects.length, data: projects })
  } catch (err) {
    console.error('Error fetching admin projects:', err)
    res.status(500).json({ success: false, error: 'Failed to retrieve projects' })
  }
}

/**
 * POST /api/v1/admin/projects
 * Create a new project
 */
export function createProject(req, res) {
  try {
    const body = req.body || {}
    if (!body.title) {
      return res.status(400).json({ success: false, error: 'Project title is required' })
    }

    const id = body.id || 'proj_' + body.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32) + '_' + Date.now().toString(36)
    const techStackJson = JSON.stringify(Array.isArray(body.techStack) ? body.techStack : (Array.isArray(body.tech_stack) ? body.tech_stack : []))
    const metricsJson = JSON.stringify(Array.isArray(body.metrics) ? body.metrics : [])

    db.prepare(`
      INSERT INTO projects (
        id, title, description, short_description, outcome, problem,
        architecture, key_challenge, solution, metrics, category, status,
        tech_stack, live_link, github_link, image, featured, reflection,
        is_published, display_order, goal_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run(
      id,
      body.title,
      body.description || body.short_description || '',
      body.short_description || '',
      body.outcome || '',
      body.problem || '',
      body.architecture || '',
      body.key_challenge || '',
      body.solution || '',
      metricsJson,
      body.category || 'AI / Automation',
      body.status || 'active',
      techStackJson,
      body.liveLink || body.live_link || null,
      body.githubLink || body.github_link || null,
      body.image || null,
      body.featured ? 1 : 0,
      body.reflection || '',
      body.is_published !== undefined ? (body.is_published ? 1 : 0) : 1,
      Number(body.display_order) || 0,
      body.goal_id || null
    )

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    persistProjectToMongo(created).catch(() => {})
    res.status(201).json({ success: true, message: 'Project created successfully', data: formatProjectRow(created) })
  } catch (err) {
    console.error('Error creating project:', err)
    res.status(500).json({ success: false, error: err.message || 'Failed to create project' })
  }
}

/**
 * PATCH /api/v1/admin/projects/:id
 * Update an existing project
 */
export function updateProject(req, res) {
  const { id } = req.params
  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    const body = req.body || {}
    const techStackJson = body.techStack !== undefined
      ? JSON.stringify(body.techStack)
      : (body.tech_stack !== undefined ? JSON.stringify(body.tech_stack) : existing.tech_stack)

    const metricsJson = body.metrics !== undefined
      ? JSON.stringify(body.metrics)
      : existing.metrics

    db.prepare(`
      UPDATE projects SET
        title = ?,
        description = ?,
        short_description = ?,
        outcome = ?,
        problem = ?,
        architecture = ?,
        key_challenge = ?,
        solution = ?,
        metrics = ?,
        category = ?,
        status = ?,
        tech_stack = ?,
        live_link = ?,
        github_link = ?,
        image = ?,
        featured = ?,
        reflection = ?,
        is_published = ?,
        display_order = ?,
        goal_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      body.title !== undefined ? body.title : existing.title,
      body.description !== undefined ? body.description : existing.description,
      body.short_description !== undefined ? body.short_description : existing.short_description,
      body.outcome !== undefined ? body.outcome : existing.outcome,
      body.problem !== undefined ? body.problem : existing.problem,
      body.architecture !== undefined ? body.architecture : existing.architecture,
      body.key_challenge !== undefined ? body.key_challenge : existing.key_challenge,
      body.solution !== undefined ? body.solution : existing.solution,
      metricsJson,
      body.category !== undefined ? body.category : existing.category,
      body.status !== undefined ? body.status : existing.status,
      techStackJson,
      body.liveLink !== undefined ? body.liveLink : (body.live_link !== undefined ? body.live_link : existing.live_link),
      body.githubLink !== undefined ? body.githubLink : (body.github_link !== undefined ? body.github_link : existing.github_link),
      body.image !== undefined ? body.image : existing.image,
      body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
      body.reflection !== undefined ? body.reflection : existing.reflection,
      body.is_published !== undefined ? (body.is_published ? 1 : 0) : existing.is_published,
      body.display_order !== undefined ? Number(body.display_order) : existing.display_order,
      body.goal_id !== undefined ? body.goal_id : existing.goal_id,
      id
    )

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    persistProjectToMongo(updated).catch(() => {})
    res.json({ success: true, message: 'Project updated successfully', data: formatProjectRow(updated) })
  } catch (err) {
    console.error('Error updating project:', err)
    res.status(500).json({ success: false, error: err.message || 'Failed to update project' })
  }
}

/**
 * DELETE /api/v1/admin/projects/:id
 * Delete a project
 */
export function deleteProject(req, res) {
  const { id } = req.params
  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    deleteProjectFromMongo(id).catch(() => {})
    res.json({ success: true, message: 'Project deleted successfully', id })
  } catch (err) {
    console.error('Error deleting project:', err)
    res.status(500).json({ success: false, error: 'Failed to delete project' })
  }
}

/* ==========================================================================
   EVENTS & CALENDAR ADMIN CONTROLLERS (Full access to private events & notes)
   ========================================================================== */

function formatEventRow(row) {
  return {
    ...row,
    all_day: Boolean(row.all_day),
    show_on_portfolio_heatmap: Boolean(row.show_on_portfolio_heatmap),
    tags: row.tags ? JSON.parse(row.tags) : [],
  }
}

/**
 * GET /api/v1/admin/events
 * Admin endpoint returning ALL events (Public + Private with private_notes)
 */
export function getAdminEvents(req, res) {
  try {
    const { category, status, visibility, search } = req.query
    let query = 'SELECT * FROM events WHERE 1=1'
    const params = []

    if (category && category !== 'All') {
      query += ' AND category = ?'
      params.push(category)
    }

    if (status && status !== 'All') {
      query += ' AND status = ?'
      params.push(status)
    }

    if (visibility && visibility !== 'All') {
      query += ' AND visibility = ?'
      params.push(visibility)
    }

    if (search && search.trim()) {
      query += ' AND (title LIKE ? OR description LIKE ? OR private_notes LIKE ?)'
      const term = `%${search.trim()}%`
      params.push(term, term, term)
    }

    query += ' ORDER BY start_at ASC'

    const rows = db.prepare(query).all(...params).map(formatEventRow)
    res.json({ success: true, count: rows.length, data: rows })
  } catch (err) {
    console.error('Error fetching admin events:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch events' })
  }
}

/**
 * POST /api/v1/admin/events
 * Create a new event
 */
export function createEvent(req, res) {
  try {
    const body = req.body || {}
    if (!body.title || !body.start_at || !body.end_at) {
      return res.status(400).json({ success: false, error: 'title, start_at, and end_at are required' })
    }

    const id = body.id || 'evt_' + crypto.randomUUID().slice(0, 12)
    const tagsJson = JSON.stringify(Array.isArray(body.tags) ? body.tags : [])

    db.prepare(`
      INSERT INTO events (
        id, title, description, category, start_at, end_at, all_day, timezone,
        location, meeting_url, external_url, status, visibility,
        show_on_portfolio_heatmap, color, tags, priority, goal_id, project_id, private_notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id,
      body.title,
      body.description || '',
      body.category || 'Learning',
      body.start_at,
      body.end_at,
      body.all_day ? 1 : 0,
      body.timezone || 'Asia/Kolkata',
      body.location || null,
      body.meeting_url || null,
      body.external_url || null,
      body.status || 'Planned',
      body.visibility || 'Private',
      body.show_on_portfolio_heatmap ? 1 : 0,
      body.color || '#B8FF3C',
      tagsJson,
      body.priority || 'medium',
      body.goal_id || null,
      body.project_id || null,
      body.private_notes || null
    )

    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
    persistEventToMongo(created).catch(() => {})
    res.status(201).json({ success: true, message: 'Event created successfully', data: formatEventRow(created) })
  } catch (err) {
    console.error('Error creating event:', err)
    res.status(500).json({ success: false, error: err.message || 'Failed to create event' })
  }
}

/**
 * PATCH /api/v1/admin/events/:id
 * Update an existing event
 */
export function updateEvent(req, res) {
  const { id } = req.params
  try {
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    const body = req.body || {}
    const tagsJson = body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags

    db.prepare(`
      UPDATE events SET
        title = ?,
        description = ?,
        category = ?,
        start_at = ?,
        end_at = ?,
        all_day = ?,
        timezone = ?,
        location = ?,
        meeting_url = ?,
        external_url = ?,
        status = ?,
        visibility = ?,
        show_on_portfolio_heatmap = ?,
        color = ?,
        tags = ?,
        priority = ?,
        goal_id = ?,
        project_id = ?,
        private_notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      body.title !== undefined ? body.title : existing.title,
      body.description !== undefined ? body.description : existing.description,
      body.category !== undefined ? body.category : existing.category,
      body.start_at !== undefined ? body.start_at : existing.start_at,
      body.end_at !== undefined ? body.end_at : existing.end_at,
      body.all_day !== undefined ? (body.all_day ? 1 : 0) : existing.all_day,
      body.timezone !== undefined ? body.timezone : existing.timezone,
      body.location !== undefined ? body.location : existing.location,
      body.meeting_url !== undefined ? body.meeting_url : existing.meeting_url,
      body.external_url !== undefined ? body.external_url : existing.external_url,
      body.status !== undefined ? body.status : existing.status,
      body.visibility !== undefined ? body.visibility : existing.visibility,
      body.show_on_portfolio_heatmap !== undefined ? (body.show_on_portfolio_heatmap ? 1 : 0) : existing.show_on_portfolio_heatmap,
      body.color !== undefined ? body.color : existing.color,
      tagsJson,
      body.priority !== undefined ? body.priority : existing.priority,
      body.goal_id !== undefined ? body.goal_id : existing.goal_id,
      body.project_id !== undefined ? body.project_id : existing.project_id,
      body.private_notes !== undefined ? body.private_notes : existing.private_notes,
      id
    )

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
    persistEventToMongo(updated).catch(() => {})
    res.json({ success: true, message: 'Event updated successfully', data: formatEventRow(updated) })
  } catch (err) {
    console.error('Error updating event:', err)
    res.status(500).json({ success: false, error: err.message || 'Failed to update event' })
  }
}

/**
 * DELETE /api/v1/admin/events/:id
 * Delete an event
 */
export function deleteEvent(req, res) {
  const { id } = req.params
  try {
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    db.prepare('DELETE FROM events WHERE id = ?').run(id)
    deleteEventFromMongo(id).catch(() => {})
    res.json({ success: true, message: 'Event deleted successfully', id })
  } catch (err) {
    console.error('Error deleting event:', err)
    res.status(500).json({ success: false, error: 'Failed to delete event' })
  }
}

/* ==========================================================================
   STRATEGIC GOALS CONTROLLERS
   ========================================================================== */

/**
 * GET /api/v1/admin/goals
 */
export function getAdminGoals(req, res) {
  try {
    const goals = db.prepare(`
      SELECT 
        g.id, g.title, g.description, g.category, g.status, g.target_date, g.color,
        g.created_at, g.updated_at,
        COUNT(DISTINCT p.id) AS total_projects,
        COUNT(DISTINCT e.id) AS total_events,
        SUM(CASE WHEN e.status = 'Completed' THEN 1 ELSE 0 END) AS completed_events
      FROM goals g
      LEFT JOIN projects p ON p.goal_id = g.id
      LEFT JOIN events e ON e.goal_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at ASC
    `).all()
    res.json({ success: true, count: goals.length, goals })
  } catch (err) {
    console.error('Error fetching admin goals:', err)
    res.status(500).json({ success: false, error: 'Failed to retrieve goals' })
  }
}

/**
 * POST /api/v1/admin/goals
 * Create a new strategic goal
 */
export function createGoal(req, res) {
  try {
    const { title, description, category, status, target_date, color } = req.body || {}
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Goal title is required' })
    }

    const id = 'goal_' + crypto.randomUUID().slice(0, 12)
    const goalData = {
      id,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'AI Engineering',
      status: status || 'in_progress',
      target_date: target_date || null,
      color: color || '#B8FF3C',
    }

    db.prepare(`
      INSERT INTO goals (id, title, description, category, status, target_date, color, created_at, updated_at)
      VALUES (@id, @title, @description, @category, @status, @target_date, @color, datetime('now'), datetime('now'))
    `).run(goalData)

    const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
    persistGoalToMongo(created).catch(() => {})
    res.status(201).json({ success: true, message: 'Goal created successfully', goal: created })
  } catch (err) {
    console.error('Error creating goal:', err)
    res.status(500).json({ success: false, error: err.message || 'Failed to create goal' })
  }
}

/**
 * PATCH /api/v1/admin/goals/:id
 * Update an existing strategic goal
 */
export function updateGoal(req, res) {
  const { id } = req.params
  try {
    const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Goal not found' })
    }

    const body = req.body || {}
    const title = body.title !== undefined ? body.title.trim() : existing.title
    const description = body.description !== undefined ? body.description.trim() : existing.description
    const category = body.category !== undefined ? body.category.trim() : existing.category
    const status = body.status !== undefined ? body.status : existing.status
    const target_date = body.target_date !== undefined ? body.target_date : existing.target_date
    const color = body.color !== undefined ? body.color : existing.color

    db.prepare(`
      UPDATE goals SET
        title = ?,
        description = ?,
        category = ?,
        status = ?,
        target_date = ?,
        color = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(title, description, category, status, target_date, color, id)

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
    persistGoalToMongo(updated).catch(() => {})
    res.json({ success: true, message: 'Goal updated successfully', goal: updated })
  } catch (err) {
    console.error('Error updating goal:', err)
    res.status(500).json({ success: false, error: err.message || 'Failed to update goal' })
  }
}

/**
 * DELETE /api/v1/admin/goals/:id
 * Delete a strategic goal
 */
export function deleteGoal(req, res) {
  const { id } = req.params
  try {
    const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Goal not found' })
    }

    // Explicitly unbind goal from projects and events
    db.prepare('UPDATE projects SET goal_id = NULL WHERE goal_id = ?').run(id)
    db.prepare('UPDATE events SET goal_id = NULL WHERE goal_id = ?').run(id)

    db.prepare('DELETE FROM goals WHERE id = ?').run(id)
    deleteGoalFromMongo(id).catch(() => {})
    res.json({ success: true, message: 'Goal deleted successfully', id })
  } catch (err) {
    console.error('Error deleting goal:', err)
    res.status(500).json({ success: false, error: 'Failed to delete goal' })
  }
}
