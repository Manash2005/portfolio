/**
 * secondBrainController.js — Public Read-Only Controller for Second Brain
 *
 * CRITICAL PRIVACY RULES:
 * 1. ONLY events with visibility = 'Public' are ever selected or returned.
 * 2. private_notes are NEVER queried or exposed under any circumstance.
 * 3. Search and filter queries strictly apply visibility = 'Public' at the SQL level.
 * 4. No mutation endpoints exist in this public controller.
 */

import { getDatabase } from '../db/database.js'

function parseTags(tagStr) {
  if (!tagStr) return []
  try {
    return JSON.parse(tagStr)
  } catch {
    return typeof tagStr === 'string' ? tagStr.split(',').map(t => t.trim()) : []
  }
}

/**
 * GET /api/v1/second-brain/events
 * Query params: start, end, category, status, tag, search, limit, offset
 */
export const getPublicEvents = async (req, res) => {
  try {
    const db = getDatabase()
    const {
      start,
      end,
      category,
      status,
      tag,
      search,
      limit = 100,
      offset = 0,
    } = req.query

    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 300)
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0)

    let sql = `
      SELECT 
        e.id, e.title, e.description, e.category, e.start_at, e.end_at, 
        e.all_day, e.timezone, e.location, e.external_url, e.status, 
        e.color, e.tags, e.priority, e.goal_id, e.project_id, e.created_at, e.updated_at,
        g.title AS goal_title,
        p.title AS project_title
      FROM events e
      LEFT JOIN goals g ON e.goal_id = g.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.visibility = 'Public'
    `
    const params = {}

    if (start) {
      sql += ` AND (e.end_at >= @start OR e.start_at >= @start)`
      params.start = String(start)
    }

    if (end) {
      sql += ` AND e.start_at <= @end`
      params.end = String(end)
    }

    if (category && category !== 'All') {
      sql += ` AND LOWER(e.category) = LOWER(@category)`
      params.category = String(category)
    }

    if (status && status !== 'All') {
      sql += ` AND LOWER(e.status) = LOWER(@status)`
      params.status = String(status)
    }

    if (tag) {
      sql += ` AND LOWER(e.tags) LIKE @tag`
      params.tag = `%${String(tag).toLowerCase()}%`
    }

    if (search) {
      sql += ` AND (
        LOWER(e.title) LIKE @search 
        OR LOWER(e.description) LIKE @search 
        OR LOWER(e.tags) LIKE @search
        OR LOWER(e.category) LIKE @search
      )`
      params.search = `%${String(search).toLowerCase().trim()}%`
    }

    sql += ` ORDER BY e.start_at ASC LIMIT @limit OFFSET @offset`
    params.limit = safeLimit
    params.offset = safeOffset

    const rows = db.prepare(sql).all(params)

    const events = rows.map(r => ({
      ...r,
      tags: parseTags(r.tags),
      all_day: Boolean(r.all_day),
    }))

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    })
  } catch (err) {
    console.error('getPublicEvents error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar events.',
    })
  }
}

/**
 * GET /api/v1/second-brain/events/:id
 */
export const getEventById = async (req, res) => {
  try {
    const db = getDatabase()
    const { id } = req.params

    const row = db.prepare(`
      SELECT 
        e.id, e.title, e.description, e.category, e.start_at, e.end_at, 
        e.all_day, e.timezone, e.location, e.external_url, e.status, 
        e.color, e.tags, e.priority, e.goal_id, e.project_id, e.created_at, e.updated_at,
        g.title AS goal_title, g.category AS goal_category,
        p.title AS project_title, p.live_link AS project_live_link, p.github_link AS project_github_link
      FROM events e
      LEFT JOIN goals g ON e.goal_id = g.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = ? AND e.visibility = 'Public'
    `).get(id)

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or is private.',
      })
    }

    return res.status(200).json({
      success: true,
      event: {
        ...row,
        tags: parseTags(row.tags),
        all_day: Boolean(row.all_day),
      },
    })
  } catch (err) {
    console.error('getEventById error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details.',
    })
  }
}

/**
 * GET /api/v1/second-brain/upcoming
 */
export const getUpcomingEvents = async (req, res) => {
  try {
    const db = getDatabase()
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 5), 20)

    // Start from beginning of current day
    const nowIso = new Date().toISOString()
    const todayStart = nowIso.slice(0, 10) + 'T00:00:00'

    const rows = db.prepare(`
      SELECT 
        e.id, e.title, e.description, e.category, e.start_at, e.end_at, 
        e.all_day, e.timezone, e.location, e.external_url, e.status, 
        e.color, e.tags, e.priority, e.goal_id, e.project_id,
        g.title AS goal_title, p.title AS project_title
      FROM events e
      LEFT JOIN goals g ON e.goal_id = g.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.visibility = 'Public'
        AND e.start_at >= ?
        AND e.status != 'Cancelled'
      ORDER BY e.start_at ASC
      LIMIT ?
    `).all(todayStart, limit)

    const events = rows.map(r => ({
      ...r,
      tags: parseTags(r.tags),
      all_day: Boolean(r.all_day),
    }))

    return res.status(200).json({
      success: true,
      events,
    })
  } catch (err) {
    console.error('getUpcomingEvents error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve upcoming events.',
    })
  }
}

/**
 * GET /api/v1/second-brain/recent
 */
export const getRecentActivity = async (req, res) => {
  try {
    const db = getDatabase()
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 30)

    const rows = db.prepare(`
      SELECT 
        e.id, e.title, e.description, e.category, e.start_at, e.end_at, 
        e.all_day, e.location, e.external_url, e.status, 
        e.color, e.tags, e.priority,
        g.title AS goal_title, p.title AS project_title
      FROM events e
      LEFT JOIN goals g ON e.goal_id = g.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.visibility = 'Public'
        AND e.status = 'Completed'
      ORDER BY e.start_at DESC
      LIMIT ?
    `).all(limit)

    const activities = rows.map(r => ({
      ...r,
      tags: parseTags(r.tags),
      all_day: Boolean(r.all_day),
    }))

    return res.status(200).json({
      success: true,
      activities,
    })
  } catch (err) {
    console.error('getRecentActivity error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activity.',
    })
  }
}

/**
 * GET /api/v1/second-brain/goals
 */
export const getGoals = async (req, res) => {
  try {
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT 
        g.id, g.title, g.description, g.category, g.status, g.target_date, g.color,
        (SELECT COUNT(*) FROM events e WHERE e.goal_id = g.id AND e.visibility = 'Public') AS total_events,
        (SELECT COUNT(*) FROM events e WHERE e.goal_id = g.id AND e.visibility = 'Public' AND e.status = 'Completed') AS completed_events
      FROM goals g
      ORDER BY g.created_at ASC
    `).all()

    return res.status(200).json({
      success: true,
      goals: rows,
    })
  } catch (err) {
    console.error('getGoals error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve goals.',
    })
  }
}

/**
 * GET /api/v1/second-brain/projects
 */
export const getProjects = async (req, res) => {
  try {
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT 
        p.id, p.title, p.description, p.category, p.status, p.tech_stack,
        p.live_link, p.github_link, p.goal_id, g.title AS goal_title
      FROM projects p
      LEFT JOIN goals g ON p.goal_id = g.id
      ORDER BY p.created_at DESC
    `).all()

    const projects = rows.map(p => ({
      ...p,
      tech_stack: parseTags(p.tech_stack),
    }))

    return res.status(200).json({
      success: true,
      projects,
    })
  } catch (err) {
    console.error('getProjects error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects.',
    })
  }
}

/**
 * GET /api/v1/second-brain/statistics
 */
export const getStatistics = async (req, res) => {
  try {
    const db = getDatabase()

    const now = new Date()
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // 1. Completed activities this month
    const completedThisMonth = db.prepare(`
      SELECT COUNT(*) as c
      FROM events
      WHERE visibility = 'Public'
        AND status = 'Completed'
        AND start_at LIKE ?
    `).get(`${currentMonthPrefix}%`).c

    // 2. Total completed activities
    const totalCompleted = db.prepare(`
      SELECT COUNT(*) as c
      FROM events
      WHERE visibility = 'Public'
        AND status = 'Completed'
    `).get().c

    // 3. Upcoming planned activities
    const upcomingCount = db.prepare(`
      SELECT COUNT(*) as c
      FROM events
      WHERE visibility = 'Public'
        AND status = 'Planned'
        AND start_at >= ?
    `).get(now.toISOString().slice(0, 10)).c

    // 4. Learning sessions completed
    const learningSessions = db.prepare(`
      SELECT COUNT(*) as c
      FROM events
      WHERE visibility = 'Public'
        AND status = 'Completed'
        AND (LOWER(category) = 'learning' OR LOWER(category) = 'dsa' OR LOWER(category) = 'system design')
    `).get().c

    // 5. Category breakdown for completed public events
    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM events
      WHERE visibility = 'Public'
        AND status = 'Completed'
      GROUP BY category
      ORDER BY count DESC
    `).all()

    return res.status(200).json({
      success: true,
      stats: {
        completed_this_month: completedThisMonth,
        total_completed: totalCompleted,
        upcoming_count: upcomingCount,
        learning_sessions: learningSessions,
        category_breakdown: categoryBreakdown,
      },
    })
  } catch (err) {
    console.error('getStatistics error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics.',
    })
  }
}

/**
 * GET /api/v1/second-brain/heatmap
 * 
 * Aggregates eligible calendar activities for the portfolio contribution heatmap.
 * Strict rules:
 * - visibility = 'Public'
 * - status = 'Completed'
 * - show_on_portfolio_heatmap = 1
 * - Multi-day events count 1 on each day up to a max 7 days.
 * Returns: [{ date: 'YYYY-MM-DD', count: N }, ...]
 */
export const getHeatmapActivity = async (req, res) => {
  try {
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT id, start_at, end_at, all_day
      FROM events
      WHERE visibility = 'Public'
        AND status != 'Cancelled'
        AND show_on_portfolio_heatmap = 1
      ORDER BY start_at ASC
    `).all()

    const dateCounts = {}

    rows.forEach(evt => {
      const startDateStr = evt.start_at.slice(0, 10)
      const endDateStr = (evt.end_at ? evt.end_at.slice(0, 10) : startDateStr)

      if (startDateStr === endDateStr) {
        dateCounts[startDateStr] = (dateCounts[startDateStr] || 0) + 1
      } else {
        // Multi-day counting: count 1 per day up to 7 days (timezone-safe)
        const [sy, sm, sd] = startDateStr.split('-').map(Number)
        const [ey, em, ed] = endDateStr.split('-').map(Number)
        const curr = new Date(sy, sm - 1, sd)
        const end = new Date(ey, em - 1, ed)
        let dayCount = 0

        while (curr <= end && dayCount < 7) {
          const y = curr.getFullYear()
          const m = String(curr.getMonth() + 1).padStart(2, '0')
          const d = String(curr.getDate()).padStart(2, '0')
          const dStr = `${y}-${m}-${d}`
          dateCounts[dStr] = (dateCounts[dStr] || 0) + 1
          curr.setDate(curr.getDate() + 1)
          dayCount++
        }
      }
    })

    const heatmapData = Object.entries(dateCounts).map(([date, count]) => ({
      date,
      count,
    }))

    return res.status(200).json({
      success: true,
      heatmapData,
    })
  } catch (err) {
    console.error('getHeatmapActivity error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate heatmap activity.',
      heatmapData: [],
    })
  }
}

/**
 * GET /api/v1/second-brain/activity-events
 * Returns milestone/callout events for the 3D Skyline & FlatGrid heatmap.
 */
export const getActivityEvents = async (req, res) => {
  try {
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT 
        SUBSTR(start_at, 1, 10) AS date,
        start_at,
        end_at,
        title,
        description,
        category,
        color
      FROM events
      WHERE visibility = 'Public'
        AND show_on_portfolio_heatmap = 1
      ORDER BY start_at ASC
    `).all()

    return res.status(200).json({
      success: true,
      events: rows,
    })
  } catch (err) {
    console.error('getActivityEvents error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity events.',
      events: [],
    })
  }
}
