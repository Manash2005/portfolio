import { useEffect, useState, useRef } from 'react'
import { parseDateString } from '../../utils/activityStats'

/**
 * Animated number count-up hook
 */
function useCountUp(targetValue, duration = 650) {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const prevTargetRef = useRef(targetValue)

  useEffect(() => {
    const startVal = prevTargetRef.current
    const diff = targetValue - startVal
    if (diff === 0) {
      setDisplayValue(targetValue)
      return
    }

    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(startVal + diff * ease)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        prevTargetRef.current = targetValue
      }
    }

    const frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [targetValue, duration])

  return displayValue
}

function StatBox({ label, value, subtext, isDate = false }) {
  const animatedNumber = useCountUp(typeof value === 'number' ? value : 0)

  return (
    <div className="flex flex-col">
      <span className="text-label text-[10px] mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-display font-semibold tracking-tight"
          style={{ color: 'var(--color-text)', lineHeight: 1.1 }}
        >
          {isDate ? value : animatedNumber}
        </span>
        {subtext && (
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--color-muted)' }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  )
}

export default function InsightsRow({ insights, sourceLabel }) {
  const { total = 0, currentStreak = 0, longestStreak = 0, busiestDay = { date: '', count: 0 } } = insights || {}

  let formattedBusiest = 'None'
  if (busiestDay && busiestDay.date && busiestDay.count > 0) {
    const d = parseDateString(busiestDay.date)
    const month = d.toLocaleString('en-US', { month: 'short' })
    formattedBusiest = `${busiestDay.count} (${month} ${d.getDate()})`
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-6 py-5 px-6 rounded-2xl border border-hairline bg-[#0E0E14]/60 backdrop-blur-md"
      role="region"
      aria-label="Activity statistics"
    >
      <StatBox
        label={`Total ${sourceLabel} activity`}
        value={total}
        subtext="contributions"
      />
      <StatBox
        label="Current streak"
        value={currentStreak}
        subtext={currentStreak === 1 ? 'day' : 'days'}
      />
      <StatBox
        label="Longest streak"
        value={longestStreak}
        subtext={longestStreak === 1 ? 'day' : 'days'}
      />
      <StatBox
        label="Busiest day"
        value={formattedBusiest}
        isDate={true}
      />
    </div>
  )
}
