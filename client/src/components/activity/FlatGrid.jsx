import { useState, useRef, useCallback } from 'react'
import { computeQuantiles, getMonthBoundaries, parseDateString } from '../../utils/activityStats'
import ActivityTooltip from './ActivityTooltip'

const LEVEL_COLORS = [
  'rgba(255, 255, 255, 0.05)',
  'rgba(184, 255, 60, 0.28)',
  'rgba(184, 255, 60, 0.52)',
  'rgba(184, 255, 60, 0.78)',
  '#B8FF3C',
]

const DAY_LABELS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']

export default function FlatGrid({
  days,
  sourceKey = 'all',
  focusedMonth,
  onMonthFocus,
  onResetMonthFocus,
}) {
  const [hoveredDay, setHoveredDay] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [activeCellIdx, setActiveCellIdx] = useState(0)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')
  const containerRef = useRef(null)

  const quantiles = computeQuantiles(days, sourceKey)
  const months = getMonthBoundaries(days, sourceKey)

  // Handle cell focus announcement
  const announceDay = useCallback((day) => {
    if (!day) return
    const d = parseDateString(day.date)
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const count = day[sourceKey] || 0
    setLiveAnnouncement(`${formatted}: ${count} contributions.`)
  }, [sourceKey])

  // Keyboard navigation: roving tabindex with arrow keys
  const handleKeyDown = (e) => {
    if (!days || days.length === 0) return

    let nextIdx = activeCellIdx

    if (e.key === 'ArrowRight') {
      // Next week (+7)
      if (activeCellIdx + 7 < days.length) nextIdx = activeCellIdx + 7
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') {
      // Prev week (-7)
      if (activeCellIdx - 7 >= 0) nextIdx = activeCellIdx - 7
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      // Next day (+1)
      if (activeCellIdx + 1 < days.length) nextIdx = activeCellIdx + 1
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      // Prev day (-1)
      if (activeCellIdx - 1 >= 0) nextIdx = activeCellIdx - 1
      e.preventDefault()
    } else if (e.key === 'Escape') {
      if (focusedMonth !== null) {
        onResetMonthFocus()
        e.preventDefault()
      }
    }

    if (nextIdx !== activeCellIdx) {
      setActiveCellIdx(nextIdx)
      const targetDay = days[nextIdx]
      announceDay(targetDay)

      // Move focus to element
      const el = containerRef.current?.querySelector(`[data-cell-idx="${nextIdx}"]`)
      if (el) el.focus()
    }
  }

  // Handle mouse hover
  const handleMouseEnter = (day, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoveredDay(day)
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
    announceDay(day)
  }

  const handleMouseLeave = () => {
    setHoveredDay(null)
  }

  // Determine if a cell is dimmed due to month focus
  const isCellDimmed = (day) => {
    if (focusedMonth === null || focusedMonth === undefined) return false
    const d = parseDateString(day.date)
    return d.getMonth() !== focusedMonth
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-auto pb-4 pt-2 select-none"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Activity heatmap flat grid"
    >
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="min-w-[780px]">
        {/* Month labels row */}
        <div className="flex text-[11px] font-mono mb-2 pl-9" aria-hidden="true">
          {months.map((m) => {
            const isSelected = focusedMonth === m.monthIndex
            return (
              <button
                key={`${m.name}-${m.weekIndex}`}
                onClick={() => {
                  if (isSelected) onResetMonthFocus()
                  else onMonthFocus(m.monthIndex)
                }}
                className="transition-colors hover:text-white cursor-pointer px-1 py-0.5 rounded text-left"
                style={{
                  width: `${(m.endDayIdx - m.startDayIdx + 1) * 2}px`,
                  minWidth: '38px',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-muted)',
                  fontWeight: isSelected ? '600' : 'normal',
                }}
                title={`Click to focus ${m.name} (${m.total} total)`}
              >
                {m.name}
              </button>
            )
          })}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-2">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between text-[9px] font-mono text-muted pr-1 pt-0.5 pb-0.5 select-none" aria-hidden="true">
            {DAY_LABELS.map((lbl, idx) => (
              <span key={idx} className="h-3 leading-3" style={{ color: 'var(--color-muted)' }}>
                {lbl}
              </span>
            ))}
          </div>

          {/* Grid columns: 53 weeks */}
          <div
            className="grid grid-flow-col gap-[3px]"
            style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
            role="grid"
            aria-label="Contributions calendar"
          >
            {days.map((day, idx) => {
              const count = day[sourceKey] || 0
              const level = quantiles.getLevel(count)
              const dimmed = isCellDimmed(day)
              const isHovered = hoveredDay?.date === day.date
              const isToday = day.date === new Date().toISOString().split('T')[0]

              return (
                <button
                  key={day.date}
                  data-cell-idx={idx}
                  tabIndex={activeCellIdx === idx ? 0 : -1}
                  disabled={day.isFuture}
                  onClick={() => announceDay(day)}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => {
                    setActiveCellIdx(idx)
                    announceDay(day)
                  }}
                  className="w-3 h-3 rounded-[2.5px] transition-all duration-150 relative focus-visible:outline-none"
                  style={{
                    backgroundColor: day.isFuture
                      ? 'transparent'
                      : LEVEL_COLORS[level],
                    opacity: dimmed ? 0.2 : 1,
                    transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: isHovered
                      ? '0 0 8px var(--color-accent)'
                      : isToday
                      ? 'inset 0 0 0 1px var(--color-accent)'
                      : 'none',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                  aria-label={`${day.date}: ${count} contributions`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Floating DOM Tooltip */}
      <ActivityTooltip
        day={hoveredDay}
        position={tooltipPos}
        visible={!!hoveredDay}
      />
    </div>
  )
}
