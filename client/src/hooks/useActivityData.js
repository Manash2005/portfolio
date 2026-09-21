import { useState, useEffect, useCallback, useRef } from 'react'
import { generateSkylineDays } from '../utils/activityStats'
import portfolioData from '../data/portfolio_data.json'

const STORAGE_KEY = 'portfolio_activity_cache_v4'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const SLOW_THRESHOLD_MS = 4000 // 4 seconds for cold start notice

/**
 * Format relative time (e.g. "just now", "12m ago", "2h ago")
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return ''
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function getInitialCache() {
  try {
    const cachedStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (cachedStr) {
      const cached = JSON.parse(cachedStr)

      // Guard: if both leetcode and gfg maps are empty, the cache is from before
      // the GFG multi-year fix. Treat as stale so fresh data is fetched.
      const lcCount = Object.keys(cached.leetcodeMap || {}).length
      const gfgCount = Object.keys(cached.gfgMap || {}).length
      if (lcCount + gfgCount === 0) {
        localStorage.removeItem(STORAGE_KEY)
        return { days: [], updatedAt: null, isCached: false, status: 'loading', isFresh: false }
      }

      const normalized = generateSkylineDays(
        cached.githubMap || {},
        cached.leetcodeMap || {},
        cached.gfgMap || {}
      )
      const isFresh = Date.now() - cached.timestamp < CACHE_TTL_MS
      return {
        days: normalized,
        updatedAt: cached.timestamp,
        isCached: true,
        status: 'ready',
        isFresh,
      }
    }
  } catch (err) {
    console.warn('Cache parse error:', err)
  }
  return {
    days: [],
    updatedAt: null,
    isCached: false,
    status: 'loading',
    isFresh: false,
  }
}

export function useActivityData() {
  const [initial] = useState(getInitialCache)
  const [days, setDays] = useState(initial.days)
  const [status, setStatus] = useState(initial.status)
  const [isSlow, setIsSlow] = useState(false)
  const [isCached, setIsCached] = useState(initial.isCached)
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt)
  const [errorMessage, setErrorMessage] = useState(null)
  const [leetcodeSummary, setLeetcodeSummary] = useState({
    total: portfolioData.stats.leetcode_fallback || 124,
    easy: 75,
    medium: 43,
    hard: 6,
  })

  const gfgSummary = {
    total: portfolioData.stats.gfg_fallback || 175,
    school: 0,
    basic: 48,
    easy: 76,
    medium: 49,
    hard: 2,
  }

  const slowTimerRef = useRef(null)

  const fetchData = useCallback(async () => {
    setStatus('loading')
    setIsSlow(false)
    setErrorMessage(null)

    // Trigger slow-loading notice after 4 seconds (Render cold start)
    slowTimerRef.current = setTimeout(() => {
      setIsSlow(true)
    }, SLOW_THRESHOLD_MS)

    const apiUrl = import.meta.env.VITE_API_URL || 'https://portfolio-c43c.onrender.com'

    try {
      // 1. Fetch GitHub contributions from primary jogruber API
      let githubMap = {}
      try {
        const ghRes = await fetch(
          'https://github-contributions-api.jogruber.de/v4/Manash2005?y=last',
          { signal: AbortSignal.timeout(7000) }
        )
        if (ghRes.ok) {
          const ghJson = await ghRes.json()
          if (Array.isArray(ghJson.contributions)) {
            ghJson.contributions.forEach((item) => {
              if (item.date) githubMap[item.date] = item.count || 0
            })
          }
        }
      } catch (ghErr) {
        console.warn('Primary GitHub API failed, falling back to backend scrape:', ghErr)
        try {
          const fbRes = await fetch(`${apiUrl}/api/v1/coding-activity/github-heatmap/Manash2005`)
          if (fbRes.ok) {
            const fbJson = await fbRes.json()
            if (Array.isArray(fbJson.heatmapData)) {
              fbJson.heatmapData.forEach((item) => {
                if (item.date) githubMap[item.date] = item.count || 0
              })
            }
          }
        } catch {
          // ignore fallback error
        }
      }

      // 2. Fetch LeetCode & GFG merged activity from backend
      let leetcodeMap = {}
      let gfgMap = {}

      try {
        const actRes = await fetch(`${apiUrl}/api/v1/coding-activity`, {
          signal: AbortSignal.timeout(10000),
        })
        if (actRes.ok) {
          const actJson = await actRes.json()
          if (Array.isArray(actJson.heatmapData)) {
            actJson.heatmapData.forEach((item) => {
              if (item.date) {
                if (item.leetcode) leetcodeMap[item.date] = item.leetcode
                if (item.gfg) gfgMap[item.date] = item.gfg
              }
            })
          }
        }
      } catch (actErr) {
        console.warn('Backend coding activity fetch failed:', actErr)
      }

      // 3. Fetch LeetCode breakdown stats
      try {
        const lcStatsRes = await fetch(`${apiUrl}/api/v1/leetcode/stats/Manash_22`, {
          signal: AbortSignal.timeout(8000),
        })
        if (lcStatsRes.ok) {
          const lcStatsJson = await lcStatsRes.json()
          if (lcStatsJson.success && lcStatsJson.stats) {
            const s = lcStatsJson.stats
            setLeetcodeSummary({
              total: (s.easy || 0) + (s.medium || 0) + (s.hard || 0) || s.all || 124,
              easy: s.easy || 0,
              medium: s.medium || 0,
              hard: s.hard || 0,
            })
          }
        }
      } catch {
        // preserve defaults
      }

      clearTimeout(slowTimerRef.current)

      // Normalize into exactly 371 days
      const normalizedDays = generateSkylineDays(githubMap, leetcodeMap, gfgMap)
      setDays(normalizedDays)
      setStatus('ready')
      setIsSlow(false)
      const now = Date.now()
      setUpdatedAt(now)
      setIsCached(false)

      // Save to localStorage with TTL
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            timestamp: now,
            githubMap,
            leetcodeMap,
            gfgMap,
          })
        )
      } catch (stErr) {
        console.warn('localStorage save failed:', stErr)
      }
    } catch (err) {
      clearTimeout(slowTimerRef.current)
      console.error('Activity data fetch error:', err)

      // Check if we have cached data to show rather than blank error
      try {
        const cachedStr = localStorage.getItem(STORAGE_KEY)
        if (cachedStr) {
          const cached = JSON.parse(cachedStr)
          const fallbackDays = generateSkylineDays(
            cached.githubMap || {},
            cached.leetcodeMap || {},
            cached.gfgMap || {}
          )
          setDays(fallbackDays)
          setUpdatedAt(cached.timestamp)
          setIsCached(true)
          setStatus('ready')
          return
        }
      } catch {
        // ignore
      }

      setStatus('error')
      setErrorMessage('Unable to load activity data. Upstream service may be temporarily unavailable.')
    }
  }, [])

  // Initial mount: fetch if not fresh in cache
  useEffect(() => {
    let isCancelled = false
    if (!initial.isFresh) {
      Promise.resolve().then(() => {
        if (!isCancelled) fetchData()
      })
    }
    return () => {
      isCancelled = true
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    }
  }, [fetchData, initial.isFresh])

  return {
    days,
    status,
    isSlow,
    isCached,
    updatedAt,
    relativeUpdated: getRelativeTime(updatedAt),
    errorMessage,
    leetcodeSummary,
    gfgSummary,
    retry: () => fetchData(),
  }
}
