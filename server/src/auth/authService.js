import crypto from 'node:crypto'
import { db } from '../db/database.js'

const MAX_FAILED_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days persistent login

/**
 * Hash a password using scrypt with a unique salt
 */
export function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return {
    hash: derivedKey.toString('hex'),
    salt,
  }
}

/**
 * Verify a password against a stored hash and salt using timing-safe comparison
 */
export function verifyPassword(password, storedHash, salt) {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
    const storedBuffer = Buffer.from(storedHash, 'hex')
    if (derivedKey.length !== storedBuffer.length) {
      return false
    }
    return crypto.timingSafeEqual(derivedKey, storedBuffer)
  } catch (err) {
    return false
  }
}

/**
 * Check if at least one admin user exists
 */
export function hasAdminUser() {
  const row = db.prepare('SELECT count(*) as count FROM admin_users').get()
  return row ? row.count > 0 : false
}

/**
 * Provision or update an administrator account
 */
export function provisionAdmin(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required.')
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  const { hash, salt } = hashPassword(password)
  const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username)

  if (existing) {
    db.prepare(`
      UPDATE admin_users
      SET password_hash = ?, salt = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(hash, salt, existing.id)
    return { id: existing.id, username, created: false }
  } else {
    const id = crypto.randomUUID()
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, salt)
      VALUES (?, ?, ?, ?)
    `).run(id, username, hash, salt)
    return { id, username, created: true }
  }
}

/**
 * Check rate limit for a client IP
 */
export function checkRateLimit(ip) {
  const now = Date.now()
  const cutoff = now - ATTEMPT_WINDOW_MS

  // Clean old entries
  db.prepare('DELETE FROM login_attempts WHERE attempt_time < ?').run(cutoff)

  const row = db.prepare(`
    SELECT count(*) as count, min(attempt_time) as oldest
    FROM login_attempts
    WHERE ip = ? AND attempt_time >= ?
  `).get(ip, cutoff)

  const count = row ? row.count : 0
  if (count >= MAX_FAILED_ATTEMPTS) {
    const oldest = row.oldest || now
    const resetTimeMs = (oldest + ATTEMPT_WINDOW_MS) - now
    const resetMinutes = Math.max(1, Math.ceil(resetTimeMs / 60000))
    return {
      allowed: false,
      remainingMinutes: resetMinutes,
    }
  }

  return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS - count }
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ip) {
  db.prepare('INSERT INTO login_attempts (ip, attempt_time) VALUES (?, ?)').run(ip, Date.now())
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(ip) {
  db.prepare('DELETE FROM login_attempts WHERE ip = ?').run(ip)
}

/**
 * Create a persistent session in SQLite
 */
export function createSession(userId) {
  const id = crypto.randomUUID()
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  db.prepare(`
    INSERT INTO sessions (id, user_id, session_token, expires_at, created_at, last_active_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, userId, sessionToken, expiresAt)

  return {
    sessionId: id,
    sessionToken,
    expiresAt,
  }
}

/**
 * Validate a session token
 */
export function validateSession(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') return null

  // Clean expired sessions periodically
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run()

  const session = db.prepare(`
    SELECT s.id, s.user_id, s.session_token, s.expires_at, u.username
    FROM sessions s
    JOIN admin_users u ON s.user_id = u.id
    WHERE s.session_token = ?
  `).get(sessionToken)

  if (!session) return null

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id)
    return null
  }

  // Touch last_active_at
  db.prepare("UPDATE sessions SET last_active_at = datetime('now') WHERE id = ?").run(session.id)

  return {
    userId: session.user_id,
    username: session.username,
    expiresAt: session.expires_at,
  }
}

/**
 * Invalidate a session (logout)
 */
export function invalidateSession(sessionToken) {
  if (!sessionToken) return false
  const res = db.prepare('DELETE FROM sessions WHERE session_token = ?').run(sessionToken)
  return res.changes > 0
}
