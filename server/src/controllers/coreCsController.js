import { db } from '../db/database.js'
import { randomUUID } from 'crypto'
import { recordActivityReward } from '../services/dsaGamificationService.js'

/**
 * List cards with comprehensive filters and review state
 */
export function listCards(req, res) {
  try {
    const { subject, subtopic, difficulty, search, status } = req.query
    const today = new Date().toISOString().split('T')[0]

    let query = `
      SELECT 
        c.*,
        r.id as review_id,
        COALESCE(r.repetition_count, 0) as repetition_count,
        COALESCE(r.interval_days, 1) as interval_days,
        COALESCE(r.ease_factor, 2.5) as ease_factor,
        r.last_reviewed_at,
        r.next_review_at,
        COALESCE(r.last_quality, 0) as last_quality,
        COALESCE(r.is_mastered, 0) as is_mastered
      FROM core_cs_cards c
      LEFT JOIN core_cs_reviews r ON c.id = r.card_id
      WHERE 1=1
    `
    const params = []

    if (subject && subject !== 'All') {
      query += ` AND c.subject = ?`
      params.push(subject)
    }

    if (subtopic) {
      query += ` AND c.subtopic = ?`
      params.push(subtopic)
    }

    if (difficulty && difficulty !== 'All') {
      query += ` AND c.difficulty = ?`
      params.push(difficulty)
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`
      query += ` AND (c.title LIKE ? OR c.question LIKE ? OR c.answer_markdown LIKE ? OR c.subtopic LIKE ?)`
      params.push(term, term, term, term)
    }

    if (status === 'due') {
      query += ` AND (r.next_review_at <= ? OR r.next_review_at IS NULL)`
      params.push(today)
    } else if (status === 'mastered') {
      query += ` AND r.is_mastered = 1`
    } else if (status === 'learning') {
      query += ` AND r.repetition_count > 0 AND r.is_mastered = 0`
    } else if (status === 'unreviewed') {
      query += ` AND r.last_reviewed_at IS NULL`
    }

    query += ` ORDER BY 
      CASE WHEN c.interview_frequency = 'Top 50 Must Know' THEN 1
           WHEN c.interview_frequency = 'Tier-1 Tech Favorite' THEN 2
           ELSE 3 END ASC,
      c.subject ASC,
      c.created_at ASC
    `

    const cards = db.prepare(query).all(...params)
    res.json({ success: true, count: cards.length, cards })
  } catch (error) {
    console.error('Error listing Core CS cards:', error)
    res.status(500).json({ success: false, error: 'Failed to retrieve Core CS cards' })
  }
}

/**
 * Get single card with review history
 */
export function getCardById(req, res) {
  try {
    const { id } = req.params
    const card = db.prepare(`
      SELECT 
        c.*,
        r.id as review_id,
        COALESCE(r.repetition_count, 0) as repetition_count,
        COALESCE(r.interval_days, 1) as interval_days,
        COALESCE(r.ease_factor, 2.5) as ease_factor,
        r.last_reviewed_at,
        r.next_review_at,
        COALESCE(r.last_quality, 0) as last_quality,
        COALESCE(r.is_mastered, 0) as is_mastered
      FROM core_cs_cards c
      LEFT JOIN core_cs_reviews r ON c.id = r.card_id
      WHERE c.id = ?
    `).get(id)

    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' })
    }

    res.json({ success: true, card })
  } catch (error) {
    console.error('Error fetching Core CS card:', error)
    res.status(500).json({ success: false, error: 'Failed to retrieve card' })
  }
}

/**
 * Get active recall drill deck due today
 */
export function getDrillDeck(req, res) {
  try {
    const { subject } = req.query
    const today = new Date().toISOString().split('T')[0]

    let query = `
      SELECT 
        c.*,
        r.id as review_id,
        COALESCE(r.repetition_count, 0) as repetition_count,
        COALESCE(r.interval_days, 1) as interval_days,
        COALESCE(r.ease_factor, 2.5) as ease_factor,
        r.last_reviewed_at,
        r.next_review_at,
        COALESCE(r.last_quality, 0) as last_quality,
        COALESCE(r.is_mastered, 0) as is_mastered
      FROM core_cs_cards c
      LEFT JOIN core_cs_reviews r ON c.id = r.card_id
      WHERE (r.next_review_at IS NULL OR r.next_review_at <= ?)
    `
    const params = [today]

    if (subject && subject !== 'All') {
      query += ` AND c.subject = ?`
      params.push(subject)
    }

    query += ` ORDER BY 
      CASE WHEN r.next_review_at <= ? THEN 1
           WHEN r.last_reviewed_at IS NULL THEN 2
           ELSE 3 END ASC,
      CASE WHEN c.interview_frequency = 'Top 50 Must Know' THEN 1
           WHEN c.interview_frequency = 'Tier-1 Tech Favorite' THEN 2
           ELSE 3 END ASC,
      RANDOM()
      LIMIT 20
    `
    params.push(today)

    const deck = db.prepare(query).all(...params)
    res.json({ success: true, count: deck.length, deck })
  } catch (error) {
    console.error('Error getting drill deck:', error)
    res.status(500).json({ success: false, error: 'Failed to generate drill deck' })
  }
}

/**
 * Submit SM-2 Active Recall Review
 */
export function submitReview(req, res) {
  try {
    const { card_id, quality } = req.body // quality: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

    if (!card_id || typeof quality !== 'number' || quality < 1 || quality > 4) {
      return res.status(400).json({ success: false, error: 'Invalid card_id or quality rating (1-4)' })
    }

    const card = db.prepare('SELECT * FROM core_cs_cards WHERE id = ?').get(card_id)
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' })
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Fetch existing review record
    const existing = db.prepare('SELECT * FROM core_cs_reviews WHERE card_id = ?').get(card_id)

    let repetition_count = existing ? existing.repetition_count : 0
    let interval_days = existing ? existing.interval_days : 1
    let ease_factor = existing ? existing.ease_factor : 2.5
    let is_mastered = 0

    // SuperMemo-2 (SM-2) Spaced Repetition Algorithm Calculation
    if (quality === 1) {
      // Again: Reset interval and repetition count
      repetition_count = 0
      interval_days = 1
      is_mastered = 0
    } else if (quality === 2) {
      // Hard: slight progression
      interval_days = Math.max(1, Math.round(interval_days * 1.2))
      repetition_count += 1
      is_mastered = 0
    } else if (quality === 3) {
      // Good: standard spaced interval
      if (repetition_count === 0) {
        interval_days = 1
      } else if (repetition_count === 1) {
        interval_days = 4
      } else {
        interval_days = Math.round(interval_days * ease_factor)
      }
      repetition_count += 1
      if (interval_days >= 7) is_mastered = 1
    } else if (quality === 4) {
      // Easy: accelerated interval
      if (repetition_count === 0) {
        interval_days = 3
      } else if (repetition_count === 1) {
        interval_days = 7
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.3)
      }
      repetition_count += 1
      is_mastered = 1
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    ease_factor = Math.round(ease_factor * 100) / 100

    // Calculate next review date
    const nextDate = new Date(now)
    nextDate.setDate(nextDate.getDate() + interval_days)
    const nextReviewStr = nextDate.toISOString().split('T')[0]

    const reviewId = existing ? existing.id : randomUUID()

    const upsertReview = db.prepare(`
      INSERT INTO core_cs_reviews (
        id, card_id, repetition_count, interval_days, ease_factor,
        last_reviewed_at, next_review_at, last_quality, is_mastered, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        repetition_count = excluded.repetition_count,
        interval_days = excluded.interval_days,
        ease_factor = excluded.ease_factor,
        last_reviewed_at = excluded.last_reviewed_at,
        next_review_at = excluded.next_review_at,
        last_quality = excluded.last_quality,
        is_mastered = excluded.is_mastered,
        updated_at = datetime('now')
    `)

    upsertReview.run(
      reviewId,
      card_id,
      repetition_count,
      interval_days,
      ease_factor,
      now.toISOString(),
      nextReviewStr,
      quality,
      is_mastered
    )

    // Schedule into Second Brain Calendar (and clean old scheduled date for this card)
    try {
      const eventTitle = `Core CS Revision: ${card.title}`
      // Remove previous planned event for this card to avoid bloating calendar
      db.prepare(`
        DELETE FROM events 
        WHERE title = ? AND status = 'Planned' AND start_at >= ?
      `).run(eventTitle, todayStr)

      // Insert next scheduled revision on nextReviewStr
      const newEventId = randomUUID()
      db.prepare(`
        INSERT INTO events (
          id, title, description, category, start_at, end_at,
          all_day, status, visibility, show_on_portfolio_heatmap
        ) VALUES (
          ?, ?, ?, 'Learning', ?, ?, 0, 'Planned', 'Private', 1
        )
      `).run(
        newEventId,
        eventTitle,
        `Active recall spaced repetition for ${card.subject} - ${card.subtopic}. ${card.key_takeaway || ''}`,
        `${nextReviewStr}T09:00:00`,
        `${nextReviewStr}T09:30:00`
      )
    } catch (calErr) {
      console.warn('Calendar event sync warning:', calErr)
    }

    // Award +15 XP and maintain active study streak
    let rewardResult = null
    try {
      rewardResult = recordActivityReward({ xpEarned: 15, isRevision: true })
    } catch (gamErr) {
      console.warn('XP award warning:', gamErr)
    }

    res.json({
      success: true,
      card_id,
      repetition_count,
      interval_days,
      ease_factor,
      next_review_at: nextReviewStr,
      is_mastered: is_mastered === 1,
      xp_earned: 15,
      streak: rewardResult?.streak || null,
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    res.status(500).json({ success: false, error: 'Failed to record review' })
  }
}

/**
 * List pre-interview rapid cheat sheets
 */
export function listCheatSheets(req, res) {
  try {
    const { subject } = req.query
    let query = `SELECT * FROM core_cs_cheat_sheets`
    const params = []

    if (subject && subject !== 'All') {
      query += ` WHERE subject = ?`
      params.push(subject)
    }

    query += ` ORDER BY subject ASC, title ASC`

    const rawSheets = db.prepare(query).all(...params)
    const sheets = rawSheets.map(s => {
      let comparison_table = null
      let key_rules = []
      try {
        comparison_table = JSON.parse(s.comparison_table_json)
      } catch {}
      try {
        key_rules = JSON.parse(s.key_rules_json || '[]')
      } catch {}

      return {
        ...s,
        comparison_table,
        key_rules,
      }
    })

    res.json({ success: true, count: sheets.length, sheets })
  } catch (error) {
    console.error('Error listing cheat sheets:', error)
    res.status(500).json({ success: false, error: 'Failed to retrieve cheat sheets' })
  }
}

/**
 * Comprehensive learning stats for Core CS Hub
 */
export function getStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const totalCards = db.prepare('SELECT count(*) as c FROM core_cs_cards').get().c
    const masteredCards = db.prepare('SELECT count(*) as c FROM core_cs_reviews WHERE is_mastered = 1').get().c
    const learningCards = db.prepare('SELECT count(*) as c FROM core_cs_reviews WHERE repetition_count > 0 AND is_mastered = 0').get().c
    const dueToday = db.prepare(`
      SELECT count(*) as c 
      FROM core_cs_cards c 
      LEFT JOIN core_cs_reviews r ON c.id = r.card_id 
      WHERE r.next_review_at IS NULL OR r.next_review_at <= ?
    `).get(today).c

    const subjectBreakdown = db.prepare(`
      SELECT 
        c.subject,
        count(c.id) as total,
        sum(CASE WHEN r.is_mastered = 1 THEN 1 ELSE 0 END) as mastered,
        sum(CASE WHEN r.next_review_at <= ? THEN 1 ELSE 0 END) as due
      FROM core_cs_cards c
      LEFT JOIN core_cs_reviews r ON c.id = r.card_id
      GROUP BY c.subject
      ORDER BY total DESC
    `).all(today)

    res.json({
      success: true,
      stats: {
        totalCards,
        masteredCards,
        learningCards,
        dueToday,
        masteryPercentage: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
        subjectBreakdown,
      }
    })
  } catch (error) {
    console.error('Error fetching Core CS stats:', error)
    res.status(500).json({ success: false, error: 'Failed to retrieve stats' })
  }
}

/**
 * Create a custom card
 */
export function createCustomCard(req, res) {
  try {
    const {
      subject,
      subtopic,
      title,
      question,
      answer_markdown,
      key_takeaway,
      difficulty = 'Standard',
      code_snippet,
      code_language,
      diagram_ascii,
    } = req.body

    if (!subject || !subtopic || !title || !question || !answer_markdown) {
      return res.status(400).json({
        success: false,
        error: 'subject, subtopic, title, question, and answer_markdown are required'
      })
    }

    const id = `custom-${randomUUID()}`
    db.prepare(`
      INSERT INTO core_cs_cards (
        id, subject, subtopic, title, question, answer_markdown,
        key_takeaway, difficulty, interview_frequency, code_snippet,
        code_language, diagram_ascii, is_custom
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 'Custom Student Card', ?, ?, ?, 1
      )
    `).run(
      id,
      subject,
      subtopic,
      title,
      question,
      answer_markdown,
      key_takeaway || null,
      difficulty,
      code_snippet || null,
      code_language || null,
      diagram_ascii || null
    )

    const created = db.prepare('SELECT * FROM core_cs_cards WHERE id = ?').get(id)
    res.status(201).json({ success: true, card: created })
  } catch (error) {
    console.error('Error creating custom card:', error)
    res.status(500).json({ success: false, error: 'Failed to create custom card' })
  }
}

/**
 * Delete custom card
 */
export function deleteCustomCard(req, res) {
  try {
    const { id } = req.params
    const card = db.prepare('SELECT * FROM core_cs_cards WHERE id = ?').get(id)
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' })
    }

    if (card.is_custom !== 1) {
      return res.status(403).json({ success: false, error: 'Curated system cards cannot be deleted' })
    }

    db.prepare('DELETE FROM core_cs_cards WHERE id = ?').run(id)
    res.json({ success: true, message: 'Custom card deleted successfully' })
  } catch (error) {
    console.error('Error deleting custom card:', error)
    res.status(500).json({ success: false, error: 'Failed to delete card' })
  }
}
