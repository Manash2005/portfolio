/**
 * Centralized API base configuration.
 *
 * During local development (localhost / 127.0.0.1), always defaults
 * to http://localhost:8000 so requests never accidentally hit the remote
 * Render production server unless explicitly overridden by VITE_API_URL.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://portfolio-c43c.onrender.com')
