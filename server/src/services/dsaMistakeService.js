import { db } from '../db/database.js'
import crypto from 'node:crypto'

export const MISTAKE_CATEGORIES = [
  { id: 'conceptual_gap', label: 'Conceptual Gap', color: '#EF4444' },
  { id: 'pattern_recognition', label: 'Pattern Recognition', color: '#F59E0B' },
  { id: 'implementation_bug', label: 'Implementation Bug', color: '#EC4899' },
  { id: 'complexity_analysis', label: 'Complexity / TLE', color: '#8B5CF6' },
  { id: 'edge_cases', label: 'Edge Cases Missed', color: '#3B82F6' },
  { id: 'language_syntax', label: 'Language / API Syntax', color: '#10B981' },
  { id: 'time_management', label: 'Time Management', color: '#6366F1' },
  { id: 'careless_error', label: 'Careless Error', color: '#E11D48' },
]

export function logMistake({ problem_id, attempt_id = null, category, mistake_description, lesson_learned = '' }) {
  if (!problem_id || !category || !mistake_description) {
    throw new Error('Problem ID, category, and mistake description are required.')
  }

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO dsa_mistake_journal (id, problem_id, attempt_id, category, mistake_description, lesson_learned)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, problem_id, attempt_id, category, mistake_description.trim(), lesson_learned ? lesson_learned.trim() : null)

  return db.prepare(`
    SELECT m.*, p.title as problem_title, p.difficulty, p.primary_topic, p.canonical_url
    FROM dsa_mistake_journal m
    JOIN dsa_problems p ON m.problem_id = p.id
    WHERE m.id = ?
  `).get(id)
}

export function getMistakes({ limit = 50, category = 'all' } = {}) {
  let query = `
    SELECT m.*, p.title as problem_title, p.difficulty, p.primary_topic, p.canonical_url
    FROM dsa_mistake_journal m
    JOIN dsa_problems p ON m.problem_id = p.id
  `
  const params = []

  if (category !== 'all') {
    query += ' WHERE m.category = ?'
    params.push(category)
  }

  query += ' ORDER BY m.created_at DESC LIMIT ?'
  params.push(limit)

  return db.prepare(query).all(...params)
}

export function getMistakeAnalytics() {
  const categoryCounts = db.prepare(`
    SELECT category, count(*) as count
    FROM dsa_mistake_journal
    GROUP BY category
    ORDER BY count DESC
  `).all()

  const total = categoryCounts.reduce((acc, curr) => acc + curr.count, 0)

  // Identify recurring pattern
  let topPattern = null
  if (categoryCounts.length > 0) {
    const top = categoryCounts[0]
    const catMeta = MISTAKE_CATEGORIES.find((c) => c.id === top.category)
    topPattern = {
      category: top.category,
      label: catMeta ? catMeta.label : top.category,
      count: top.count,
      percentage: total > 0 ? Math.round((top.count / total) * 100) : 0,
    }
  }

  return {
    total,
    categoryCounts,
    topPattern,
    availableCategories: MISTAKE_CATEGORIES,
  }
}
