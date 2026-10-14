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
 * Merges githubMap, leetcodeMap, gfgMap, and calendarMap by 'YYYY-MM-DD'.
 */
export function generateSkylineDays(githubMap = {}, leetcodeMap = {}, gfgMap = {}, calendarMap = {}) {
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
    const cal = isFuture ? 0 : Number(calendarMap[dateStr] || 0)
    const all = gh + lc + gfg + cal

    days.push({
      date: dateStr,
      github: gh,
      leetcode: lc,
      gfg: gfg,
      calendar: cal,
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
      maxVal: 1,
      getLevel: () => 0,
      getNormalizedHeight: () => 0,
    }
  }

  const maxVal = nonZero[nonZero.length - 1] || 1
  const p95Idx = Math.floor(nonZero.length * 0.95)
  const p95 = Math.max(1, nonZero[p95Idx] || maxVal)

  const q25 = nonZero[Math.floor(nonZero.length * 0.25)] || 1
  const q50 = nonZero[Math.floor(nonZero.length * 0.5)] || 1
  const q75 = nonZero[Math.floor(nonZero.length * 0.75)] || 1

  return {
    q25,
    q50,
    q75,
    p95,
    maxVal,
    getLevel: (count) => {
      if (!count || count <= 0) return 0
      if (count <= q25) return 1
      if (count <= q50) return 2
      if (count <= q75) return 3
      return 4
    },
    // Strictly linear normalized height directly proportional to count
    // (e.g. value 6 is exactly 2x value 3 and 6x value 1)
    getNormalizedHeight: (count) => {
      if (!count || count <= 0) return 0
      return count / maxVal
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

/**
 * Event category color palette and helper function.
 * Supports categories: failed/rejection (red), orange/setback, yellow/interview, green/success.
 * Also supports direct custom hex code via event.color or auto-detection from title.
 */
export const EVENT_CATEGORY_COLORS = {
  // Red: failure / rejection
  failed: '#FF4D4D',
  fail: '#FF4D4D',
  rejection: '#FF4D4D',
  rejected: '#FF4D4D',
  failure: '#FF4D4D',
  red: '#FF4D4D',

  // Orange: setback / warning / obstacle
  orange: '#FF8A3D',
  setback: '#FF8A3D',
  warning: '#FF8A3D',
  obstacle: '#FF8A3D',

  // Yellow: interview / assessment / pending / milestone
  yellow: '#FFD13B',
  interview: '#FFD13B',
  assessment: '#FFD13B',
  pending: '#FFD13B',
  milestone: '#FFD13B',

  // Green: success / offer / achievement / pass
  green: '#B8FF3C',
  lime: '#B8FF3C',
  success: '#B8FF3C',
  offer: '#B8FF3C',
  achievement: '#B8FF3C',
  win: '#B8FF3C',
  passed: '#B8FF3C',
}

export function getEventColor(event) {
  if (!event) return '#B8FF3C'
  if (event.color && (event.color.startsWith('#') || event.color.startsWith('rgb'))) {
    return event.color
  }

  const key = (event.category || event.type || '').toLowerCase().trim()
  if (EVENT_CATEGORY_COLORS[key]) {
    return EVENT_CATEGORY_COLORS[key]
  }

  // Auto-detect from title if category is omitted
  const title = (event.title || '').toLowerCase()
  if (title.includes('fail') || title.includes('reject')) return '#FF4D4D'
  if (title.includes('interview') || title.includes('assess')) return '#FFD13B'
  if (title.includes('offer') || title.includes('pass') || title.includes('win') || title.includes('accept') || title.includes('success')) {
    return '#B8FF3C'
  }

  return '#B8FF3C'
}

