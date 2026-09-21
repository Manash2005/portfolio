/**
 * activityStats.js — Data normalization, stats calculation, quantile
 * scaling and month segmentation for the Activity Skyline and Flat grid.
 */

/**
 * Format a Date object to YYYY-MM-DD string without timezone shifting.
 */
export function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parses YYYY-MM-DD string into year, month (0-indexed), date integers.
 */
export function parseDateString(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Generates an array of exactly 371 days (53 weeks x 7 days),
 * Sunday-aligned, ending on the Saturday of the current week.
 *
 * Merges githubMap, leetcodeMap, and gfgMap by 'YYYY-MM-DD'.
 */
export function generateSkylineDays(githubMap = {}, leetcodeMap = {}, gfgMap = {}) {
  const today = new Date()
  const todayStr = formatDate(today)

  // Find Saturday of the current week (0 = Sun, 6 = Sat)
  const currentDayOfWeek = today.getDay()
  const endSaturday = new Date(today)
  endSaturday.setDate(today.getDate() + (6 - currentDayOfWeek))

  // 53 weeks = 371 days. The start date is 370 days before endSaturday (a Sunday)
  const startDate = new Date(endSaturday)
  startDate.setDate(endSaturday.getDate() - 370)

  const days = []
  const curr = new Date(startDate)

  for (let i = 0; i < 371; i++) {
    const dateStr = formatDate(curr)
    const dayOfWeek = curr.getDay()
    const weekIndex = Math.floor(i / 7)
    const isFuture = dateStr > todayStr

    const gh = isFuture ? 0 : Number(githubMap[dateStr] || 0)
    const lc = isFuture ? 0 : Number(leetcodeMap[dateStr] || 0)
    const gfg = isFuture ? 0 : Number(gfgMap[dateStr] || 0)
    const all = gh + lc + gfg

    days.push({
      date: dateStr,
      github: gh,
      leetcode: lc,
      gfg: gfg,
      all,
      dayOfWeek,
      weekIndex,
      isFuture,
    })

    curr.setDate(curr.getDate() + 1)
  }

  return days
}

/**
 * Computes streaks, total, and busiest day for a selected source.
 * sources: 'all' | 'github' | 'leetcode' | 'gfg'
 */
export function computeInsights(days, sourceKey = 'all') {
  if (!days || days.length === 0) {
    return { total: 0, currentStreak: 0, longestStreak: 0, busiestDay: { date: '', count: 0 } }
  }

  const today = formatDate(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = formatDate(yesterdayDate)

  let total = 0
  let longestStreak = 0
  let currentRunningStreak = 0
  let busiestDay = { date: '', count: 0 }

  // Traverse chronologically
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    if (day.isFuture) continue

    const count = day[sourceKey] || 0
    total += count

    if (count > busiestDay.count) {
      busiestDay = { date: day.date, count }
    }

    if (count > 0) {
      currentRunningStreak++
      if (currentRunningStreak > longestStreak) {
        longestStreak = currentRunningStreak
      }
    } else {
      currentRunningStreak = 0
    }
  }

  // Calculate current active streak:
  // Starts from today or yesterday, counting backward as long as each day had activity > 0.
  let currentStreak = 0
  const activeDays = days.filter((d) => !d.isFuture)
  const lastIndex = activeDays.length - 1

  if (lastIndex >= 0) {
    const lastDay = activeDays[lastIndex]
    const prevDay = activeDays[lastIndex - 1]

    let checkIndex = -1
    if (lastDay && lastDay.date === today && (lastDay[sourceKey] || 0) > 0) {
      checkIndex = lastIndex
    } else if (
      (lastDay && lastDay.date === yesterday && (lastDay[sourceKey] || 0) > 0) ||
      (prevDay && prevDay.date === yesterday && (prevDay[sourceKey] || 0) > 0)
    ) {
      checkIndex = lastDay.date === yesterday ? lastIndex : lastIndex - 1
    }

    if (checkIndex !== -1) {
      for (let i = checkIndex; i >= 0; i--) {
        if ((activeDays[i][sourceKey] || 0) > 0) {
          currentStreak++
        } else {
          break
        }
      }
    }
  }

  return {
    total,
    currentStreak,
    longestStreak,
    busiestDay,
  }
}

/**
 * Computes quantiles of non-zero days for height and color intensity mapping (levels 0-4).
 * Capped at 95th percentile so a single huge day does not flatten everything.
 */
export function computeQuantiles(days, sourceKey = 'all') {
  const nonZero = days
    .filter((d) => !d.isFuture && (d[sourceKey] || 0) > 0)
    .map((d) => d[sourceKey])
    .sort((a, b) => a - b)

  if (nonZero.length === 0) {
    return {
      q25: 1,
      q50: 1,
      q75: 1,
      p95: 1,
      getLevel: () => 0,
      getNormalizedHeight: () => 0,
    }
  }

  const p95Idx = Math.floor(nonZero.length * 0.95)
  const p95 = Math.max(1, nonZero[p95Idx] || nonZero[nonZero.length - 1])

  const q25 = nonZero[Math.floor(nonZero.length * 0.25)] || 1
  const q50 = nonZero[Math.floor(nonZero.length * 0.5)] || 1
  const q75 = nonZero[Math.floor(nonZero.length * 0.75)] || 1

  return {
    q25,
    q50,
    q75,
    p95,
    getLevel: (count) => {
      if (!count || count <= 0) return 0
      if (count <= q25) return 1
      if (count <= q50) return 2
      if (count <= q75) return 3
      return 4
    },
    // Height between 0.05 (base tile) and 1.0 (max bar height) using sqrt scaling
    getNormalizedHeight: (count) => {
      if (!count || count <= 0) return 0.02
      const clamped = Math.min(count, p95)
      // sqrt scale for balanced skyline heights
      const ratio = Math.sqrt(clamped) / Math.sqrt(p95)
      return 0.12 + ratio * 0.88
    },
  }
}

/**
 * Calculates month boundaries for month labels and focus selection.
 * Returns array of { name: 'Jan', weekIndex, startDayIdx, endDayIdx, total }
 */
export function getMonthBoundaries(days, sourceKey = 'all') {
  const months = []
  let lastMonth = -1

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const d = parseDateString(day.date)
    const m = d.getMonth()

    if (m !== lastMonth) {
      if (months.length > 0) {
        months[months.length - 1].endDayIdx = i - 1
      }
      months.push({
        name: MONTH_NAMES[m],
        monthIndex: m,
        weekIndex: day.weekIndex,
        startDayIdx: i,
        endDayIdx: i,
        total: 0,
      })
      lastMonth = m
    }

    if (months.length > 0 && !day.isFuture) {
      months[months.length - 1].total += day[sourceKey] || 0
      months[months.length - 1].endDayIdx = i
    }
  }

  return months
}
