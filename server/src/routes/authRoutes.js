import express from 'express'
import {
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  verifyPassword,
  createSession,
  invalidateSession,
  validateSession,
} from '../auth/authService.js'
import { db } from '../db/database.js'
import { extractToken, requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * POST /api/v1/admin/login
 * Authenticates admin credentials, handles rate limiting, and issues session cookie & token
 */
router.post('/login', (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'

  // 1. Rate limiting check
  const rateLimit = checkRateLimit(ip)
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many failed login attempts. Please wait ${rateLimit.remainingMinutes} minute(s) before trying again.`,
    })
  }

  const { username, password } = req.body || {}
  if (!username || !password) {
    recordFailedAttempt(ip)
    return res.status(400).json({
      success: false,
      error: 'Username and password are required',
    })
  }

  // 2. Lookup admin user
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username)
  if (!user) {
    recordFailedAttempt(ip)
    return res.status(401).json({
      success: false,
      error: 'Invalid username or password',
    })
  }

  // 3. Verify password hash
  const isValid = verifyPassword(password, user.password_hash, user.salt)
  if (!isValid) {
    recordFailedAttempt(ip)
    return res.status(401).json({
      success: false,
      error: 'Invalid username or password',
    })
  }

  // 4. Success — reset attempts, create session
  clearFailedAttempts(ip)
  const session = createSession(user.id)

  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('session_token', session.sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })

  return res.json({
    success: true,
    message: 'Authentication successful',
    sessionToken: session.sessionToken,
    user: {
      username: user.username,
      expiresAt: session.expiresAt,
    },
  })
})

/**
 * POST /api/v1/admin/logout
 * Terminates the active session and clears the cookie
 */
router.post('/logout', (req, res) => {
  const token = extractToken(req)
  if (token) {
    invalidateSession(token)
  }

  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  })

  return res.json({
    success: true,
    message: 'Logged out successfully',
  })
})

/**
 * GET /api/v1/admin/session
 * Verifies if current request has a valid active admin session
 */
router.get('/session', (req, res) => {
  const token = extractToken(req)
  if (!token) {
    return res.json({
      success: true,
      authenticated: false,
      user: null,
    })
  }

  const session = validateSession(token)
  if (!session) {
    return res.json({
      success: true,
      authenticated: false,
      user: null,
    })
  }

  return res.json({
    success: true,
    authenticated: true,
    user: session,
  })
})

export default router
