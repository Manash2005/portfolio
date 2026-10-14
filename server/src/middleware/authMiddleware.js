import { validateSession } from '../auth/authService.js'

/**
 * Helper to extract session token from cookies or authorization header
 */
export function extractToken(req) {
  // 1. Check cookies (HttpOnly cookie)
  if (req.cookies && req.cookies.session_token) {
    return req.cookies.session_token
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1]
    }
    return authHeader
  }

  // 3. Check custom header
  if (req.headers['x-admin-token']) {
    return req.headers['x-admin-token']
  }

  return null
}

/**
 * Strict auth middleware: requires valid admin session
 */
export function requireAdmin(req, res, next) {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin session required',
    })
  }

  const session = validateSession(token)
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Session invalid or expired',
    })
  }

  req.admin = session
  req.sessionToken = token
  next()
}

/**
 * Optional auth middleware: sets req.admin if valid session, but doesn't block
 */
export function optionalAdmin(req, res, next) {
  const token = extractToken(req)
  if (token) {
    const session = validateSession(token)
    if (session) {
      req.admin = session
      req.sessionToken = token
    }
  }
  next()
}
