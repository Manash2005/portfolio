import { parseDateString } from '../../utils/activityStats'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ActivityTooltip({ day, position, visible }) {
  if (!visible || !day) return null

  const d = parseDateString(day.date)
  const weekday = WEEKDAYS[d.getDay()]
  const monthName = MONTH_NAMES[d.getMonth()]
  const dayNum = d.getDate()
  const year = d.getFullYear()
  const formattedDate = `${weekday}, ${monthName} ${dayNum}, ${year}`

  const isRest = (day.all || 0) === 0

  return (
    <div
      role="tooltip"
      aria-hidden={!visible}
      className="pointer-events-none fixed z-50 px-3.5 py-2.5 rounded-lg border border-hairline shadow-2xl backdrop-blur-xl transition-all duration-75"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -125%)',
        background: 'rgba(14, 14, 20, 0.95)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        minWidth: '220px',
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <span
          className="text-xs font-mono font-medium"
          style={{ color: 'var(--color-text)', letterSpacing: '0.02em' }}
        >
          {formattedDate}
        </span>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: isRest ? 'rgba(255, 255, 255, 0.06)' : 'rgba(184, 255, 60, 0.15)',
            color: isRest ? 'var(--color-muted)' : 'var(--color-accent)',
          }}
        >
          {isRest ? 'Rest day' : `${day.all} total`}
        </span>
      </div>

      <div
        className="pt-1.5 border-t border-hairline flex items-center justify-between text-[11px] font-mono"
        style={{ color: 'var(--color-muted)' }}
      >
        <span>
          GitHub <strong style={{ color: day.github > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>{day.github}</strong>
        </span>
        <span>·</span>
        <span>
          LeetCode <strong style={{ color: day.leetcode > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>{day.leetcode}</strong>
        </span>
        <span>·</span>
        <span>
          GFG <strong style={{ color: day.gfg > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>{day.gfg}</strong>
        </span>
      </div>
    </div>
  )
}
