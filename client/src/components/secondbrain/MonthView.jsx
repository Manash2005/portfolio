import { useMemo } from 'react'
import { getEventColor } from '../../utils/activityStats'
import { Clock } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthView({
  currentDate,
  events = [],
  onSelectEvent,
  onSelectDate,
}) {
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Map events by date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach((evt) => {
      if (!evt.start_at) return
      const dateKey = evt.start_at.slice(0, 10)
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(evt)
    })
    return map
  }, [events])

  // Build 35 or 42 grid cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const cells = []

    // 1. Trailing days from previous month
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i
      const d = new Date(currentYear, currentMonth - 1, dayNum)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      cells.push({
        date: d,
        dateStr,
        dayNum,
        isCurrentMonth: false,
      })
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const d = new Date(currentYear, currentMonth, day)
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({
        date: d,
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
      })
    }

    // 3. Leading days for next month to complete grid
    const remaining = (7 - (cells.length % 7)) % 7
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const d = new Date(currentYear, currentMonth + 1, nextDay)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      cells.push({
        date: d,
        dateStr,
        dayNum: nextDay,
        isCurrentMonth: false,
      })
    }

    return cells
  }, [currentYear, currentMonth])

  return (
    <div className="w-full flex flex-col rounded-2xl border border-hairline bg-[#0B0B10] overflow-hidden shadow-2xl">
      {/* Weekday column headers */}
      <div className="grid grid-cols-7 border-b border-hairline bg-[#0E0E14] text-center select-none">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={idx}
            className="py-2.5 text-xs font-mono font-medium text-muted uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 divide-x divide-y divide-hairline">
        {calendarCells.map((cell) => {
          const isToday = cell.dateStr === todayStr
          const dayEvents = eventsByDate[cell.dateStr] || []
          const hasEvents = dayEvents.length > 0

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate && onSelectDate(cell.date)}
              className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col transition-colors cursor-pointer group ${
                cell.isCurrentMonth
                  ? 'bg-transparent hover:bg-white/[0.02]'
                  : 'bg-white/[0.008] opacity-50 hover:opacity-75'
              }`}
            >
              {/* Day Number Row */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono font-semibold transition-transform group-hover:scale-105 ${
                    isToday
                      ? 'bg-accent text-[#08080C] shadow-[0_0_8px_rgba(184,255,60,0.6)] font-bold'
                      : cell.isCurrentMonth
                      ? 'text-white/80'
                      : 'text-muted'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* Multi-event density indicator */}
                {dayEvents.length > 1 && (
                  <span
                    className="text-[10px] font-mono text-muted/60 px-1 rounded"
                    title={`${dayEvents.length} activities`}
                  >
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event chips */}
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((evt) => {
                  const color = evt.color || getEventColor(evt)
                  return (
                    <button
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent(evt)
                      }}
                      className="w-full text-left px-2 py-1 rounded text-[11px] font-mono truncate transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: `${color}14`,
                        borderColor: `${color}35`,
                        color: '#FFFFFF',
                      }}
                      title={`${evt.title} (${evt.category})`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
                      />
                      <span className="truncate">{evt.title}</span>
                    </button>
                  )
                })}

                {/* Show "+N more" badge if more than 3 */}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] font-mono text-accent pl-1 font-medium">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
