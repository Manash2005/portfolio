import { useState, useEffect, useCallback, useRef } from 'react'
import { generateSkylineDays } from '../utils/activityStats'
import portfolioData from '../data/portfolio_data.json'
import activitySnapshot from '../data/activitySnapshot.json'
import { API_BASE_URL } from '../utils/apiConfig'

const STORAGE_KEY = 'portfolio_activity_cache_v8'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const SLOW_THRESHOLD_MS = 4000

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
      const lcCount = Object.keys(cached.leetcodeMap || {}).length
      const gfgCount = Object.keys(cached.gfgMap || {}).length
      if (lcCount + gfgCount > 0) {
        const normalized = generateSkylineDays(
          cached.githubMap || {},
          cached.leetcodeMap || {},
          cached.gfgMap || {},
          cached.calendarMap || {}
        )
        const isFresh = Date.now() - cached.timestamp < CACHE_TTL_MS
        return {
          days: normalized,
          updatedAt: cached.timestamp,
          isCached: true,
          status: 'ready',
          isFresh,
          activityEvents: cached.activityEvents || portfolioData.activity_events || [],
          githubMap: cached.githubMap || {},
          leetcodeMap: cached.leetcodeMap || {},
          gfgMap: cached.gfgMap || {},
          calendarMap: cached.calendarMap || {},
        }
      }
    }
  } catch (err) {
    console.warn('Cache parse error:', err)
  }

  // Instant fallback to bundled snapshot so Skyline loads immediately on project start
  const snapshotDays = generateSkylineDays(
    activitySnapshot.githubMap || {},
    activitySnapshot.leetcodeMap || {},
    activitySnapshot.gfgMap || {},
    activitySnapshot.calendarMap || {}
  )

  return {
    days: snapshotDays,
    updatedAt: activitySnapshot.timestamp || Date.now(),
    isCached: true,
    status: 'ready',
    isFresh: false,
    activityEvents: activitySnapshot.activityEvents || portfolioData.activity_events || [],
    githubMap: activitySnapshot.githubMap || {},
    leetcodeMap: activitySnapshot.leetcodeMap || {},
    gfgMap: activitySnapshot.gfgMap || {},
    calendarMap: activitySnapshot.calendarMap || {},
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
  const [activityEvents, setActivityEvents] = useState(initial.activityEvents || portfolioData.activity_events || [])
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
    // Only show loading if we don't have any days yet
    if (days.length === 0) {
      setStatus('loading')
    }
    setIsSlow(false)
    setErrorMessage(null)

    slowTimerRef.current = setTimeout(() => { setIsSlow(true) }, SLOW_THRESHOLD_MS)

    const apiUrl = API_BASE_URL

    try {
      // Fetch all sources concurrently in parallel
      const [ghRes, lcRes, gfgRes, calRes, evtRes, lcStatsRes] = await Promise.allSettled([
        // 1. GitHub contributions (jogruber API with backend fallback)
        (async () => {
          try {
            const res = await fetch(
              'https://github-contributions-api.jogruber.de/v4/Manash2005?y=last',
              { signal: AbortSignal.timeout(6000) }
            )
            if (res.ok) {
              const json = await res.json()
              if (Array.isArray(json.contributions)) {
                const map = {}
                json.contributions.forEach((item) => {
                  if (item.date) map[item.date] = item.count || 0
                })
                return map
              }
            }
          } catch { /* fallback to backend below */ }

          const fbRes = await fetch(`${apiUrl}/api/v1/coding-activity/github-heatmap/Manash2005`, {
            signal: AbortSignal.timeout(6000),
          })
          if (fbRes.ok) {
            const fbJson = await fbRes.json()
            if (Array.isArray(fbJson.heatmapData)) {
              const map = {}
              fbJson.heatmapData.forEach((item) => {
                if (item.date) map[item.date] = item.count || 0
              })
              return map
            }
          }
          return null
        })(),

        // 2. LeetCode calendar proxy
        (async () => {
          const res = await fetch(`${apiUrl}/api/v1/coding-activity/leetcode-calendar`, {
            signal: AbortSignal.timeout(12000),
          })
          if (res.ok) {
            const json = await res.json()
            if (json.calendar && Object.keys(json.calendar).length > 0) {
              const map = {}
              Object.entries(json.calendar).forEach(([date, count]) => {
                map[date] = Number(count)
              })
              return map
            }
          }
          return null
        })(),

        // 3. GFG calendar proxy
        (async () => {
          const res = await fetch(`${apiUrl}/api/v1/coding-activity/gfg-calendar`, {
            signal: AbortSignal.timeout(15000),
          })
          if (res.ok) {
            const json = await res.json()
            if (json.calendar && Object.keys(json.calendar).length > 0) {
              const map = {}
              Object.entries(json.calendar).forEach(([date, count]) => {
                map[date] = Number(count)
              })
              return map
            }
          }
          return null
        })(),

        // 4. Second Brain Calendar Activity Heatmap
        (async () => {
          const res = await fetch(`${apiUrl}/api/v1/second-brain/heatmap`, {
            signal: AbortSignal.timeout(6000),
          })
          if (res.ok) {
            const json = await res.json()
            if (Array.isArray(json.heatmapData)) {
              const map = {}
              json.heatmapData.forEach((item) => {
                if (item.date) map[item.date] = Number(item.count || 0)
              })
              return map
            }
          }
          return null
        })(),

        // 5. Dynamic Activity Callout Events
        (async () => {
          const res = await fetch(`${apiUrl}/api/v1/second-brain/activity-events`, {
            signal: AbortSignal.timeout(6000),
          })
          if (res.ok) {
            const json = await res.json()
            if (Array.isArray(json.events)) {
              return json.events
            }
          }
          return null
        })(),

        // 6. LeetCode difficulty stats
        (async () => {
          const res = await fetch(`${apiUrl}/api/v1/leetcode/stats/Manash_22`, {
            signal: AbortSignal.timeout(6000),
          })
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.stats) {
              return json.stats
            }
          }
          return null
        })(),
      ])

      clearTimeout(slowTimerRef.current)

      // Merge results with existing baseline
      const githubMap = (ghRes.status === 'fulfilled' && ghRes.value) ? ghRes.value : initial.githubMap
      const leetcodeMap = (lcRes.status === 'fulfilled' && lcRes.value) ? lcRes.value : initial.leetcodeMap
      const gfgMap = (gfgRes.status === 'fulfilled' && gfgRes.value) ? gfgRes.value : initial.gfgMap
      const calendarMap = (calRes.status === 'fulfilled' && calRes.value) ? calRes.value : initial.calendarMap

      if (evtRes.status === 'fulfilled' && Array.isArray(evtRes.value)) {
        setActivityEvents(evtRes.value)
      }

      if (lcStatsRes.status === 'fulfilled' && lcStatsRes.value) {
        const s = lcStatsRes.value
        setLeetcodeSummary({
          total: (s.easy || 0) + (s.medium || 0) + (s.hard || 0) || s.all || 124,
          easy: s.easy || 0,
          medium: s.medium || 0,
          hard: s.hard || 0,
        })
      }

      const normalizedDays = generateSkylineDays(githubMap, leetcodeMap, gfgMap, calendarMap)
      setDays(normalizedDays)
      setStatus('ready')
      setIsSlow(false)
      const now = Date.now()
      setUpdatedAt(now)
      setIsCached(false)

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          timestamp: now,
          githubMap,
          leetcodeMap,
          gfgMap,
          calendarMap,
          activityEvents: (evtRes.status === 'fulfilled' && Array.isArray(evtRes.value)) ? evtRes.value : activityEvents,
        }))
      } catch (stErr) {
        console.warn('localStorage save failed:', stErr)
      }
    } catch (err) {
      clearTimeout(slowTimerRef.current)
      console.error('Activity data fetch error:', err)
      if (days.length === 0) {
        setStatus('error')
        setErrorMessage('Unable to load activity data. Upstream service may be temporarily unavailable.')
      } else {
        // We already have snapshot or cached data loaded, keep showing it without interrupting the user
        setStatus('ready')
      }
    }
  }, [days.length, initial, activityEvents])

  useEffect(() => {
    let isCancelled = false
    // Always revalidate in background on mount (SWR) so new events appear immediately
    Promise.resolve().then(() => {
      if (!isCancelled) fetchData()
    })

    // Revalidate whenever an event or project is updated in the admin panel
    const handleInvalidate = () => {
      if (!isCancelled) fetchData()
    }
    window.addEventListener('portfolio-activity-invalidate', handleInvalidate)

    return () => {
      isCancelled = true
      window.removeEventListener('portfolio-activity-invalidate', handleInvalidate)
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    }
  }, [fetchData])

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
    activityEvents,
    retry: () => fetchData(),
  }
}
