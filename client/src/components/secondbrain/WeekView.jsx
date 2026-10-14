import { useMemo } from 'react'
import { getEventColor } from '../../utils/activityStats'
import { Clock } from 'lucide-react'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 to 22:00
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekView({
  currentDate,
  events = [],
  onSelectEvent,
  onSelectDate,
}) {
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // 7 days of the active week (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return {
        date: d,
        dateStr,
        dayName: WEEKDAYS[i],
        dayNum: d.getDate(),
      }
    })
  }, [currentDate])

  // Split all-day vs timed events for each week day
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay = {}
    const timed = {}

    weekDays.forEach((wd) => {
      allDay[wd.dateStr] = []
      timed[wd.dateStr] = []
    })

    events.forEach((evt) => {
      if (!evt.start_at) return
      const dateStr = evt.start_at.slice(0, 10)
      if (allDay[dateStr] && evt.all_day) {
        allDay[dateStr].push(evt)
      } else if (timed[dateStr]) {
        timed[dateStr].push(evt)
      }
    })

    return { allDayEvents: allDay, timedEvents: timed }
  }, [weekDays, events])

  // Helper to compute top & height percentage within 08:00 to 23:00 (15 hours = 900 minutes)
  const getEventPosition = (startAt, endAt) => {
    try {
      const start = new Date(startAt)
      const end = endAt ? new Date(endAt) : new Date(start.getTime() + 60 * 60 * 1000)

      const startMinutes = start.getHours() * 60 + start.getMinutes()
      const endMinutes = end.getHours() * 60 + end.getMinutes()

      const baseMinutes = 8 * 60 // 08:00
      const totalMinutes = 15 * 60 // 15 hours

      const topPercent = Math.max(0, Math.min(100, ((startMinutes - baseMinutes) / totalMinutes) * 100))
      const rawHeightPercent = Math.max(3, ((Math.max(30, endMinutes - startMinutes)) / totalMinutes) * 100)
      const heightPercent = Math.min(100 - topPercent, rawHeightPercent)

      return { top: `${topPercent}%`, height: `${heightPercent}%` }
    } catch {
      return { top: '0%', height: '8%' }
    }
  }

  return (
    <div className="w-full flex flex-col rounded-2xl border border-hairline bg-[#0B0B10] overflow-hidden shadow-2xl">
      {/* Week Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-hairline bg-[#0E0E14] select-none">
        <div className="p-3 text-[11px] font-mono text-muted text-center border-r border-hairline">
          GMT+5:30
        </div>
        {weekDays.map((wd) => {
          const isToday = wd.dateStr === todayStr
          return (
            <div
              key={wd.dateStr}
              onClick={() => onSelectDate && onSelectDate(wd.date)}
              className="py-2.5 px-1 sm:px-2 text-center border-r border-hairline last:border-r-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-[11px] font-mono text-muted uppercase">
                {wd.dayName}
              </div>
              <div
                className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-mono font-semibold mt-0.5 ${
                  isToday
                    ? 'bg-accent text-[#08080C] shadow-[0_0_8px_rgba(184,255,60,0.6)] font-bold'
                    : 'text-white'
                }`}
              >
                {wd.dayNum}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-Day Events Banner */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-hairline bg-[#0B0B10] text-xs font-mono">
        <div className="p-2 text-[10px] text-muted text-center border-r border-hairline self-center">
          All-day
        </div>
        {weekDays.map((wd) => {
          const dayAllDay = allDayEvents[wd.dateStr] || []
          return (
            <div
              key={wd.dateStr}
              className="p-1 border-r border-hairline last:border-r-0 min-h-[32px] flex flex-col gap-1"
            >
              {dayAllDay.map((evt) => {
                const color = evt.color || getEventColor(evt)
                return (
                  <button
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="w-full text-left px-2 py-0.5 rounded text-[10px] font-mono truncate border transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: `${color}18`,
                      borderColor: `${color}40`,
                      color: '#FFFFFF',
                    }}
                    title={evt.title}
                  >
                    {evt.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Timed Events Grid (Hourly) */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative min-h-[600px] overflow-x-auto">
        {/* Time gutter */}
        <div className="border-r border-hairline bg-[#0E0E14]/40 select-none flex flex-col">
          {HOURS.map((hr) => (
            <div
              key={hr}
              className="h-12 border-b border-hairline/40 text-[10px] font-mono text-muted text-center pt-1"
            >
              {String(hr).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 7 Day columns */}
        {weekDays.map((wd) => {
          const dayTimed = timedEvents[wd.dateStr] || []
          return (
            <div
              key={wd.dateStr}
              className="relative border-r border-hairline last:border-r-0 flex flex-col"
            >
              {/* Hour slot horizontal background guidelines */}
              {HOURS.map((hr) => (
                <div
                  key={hr}
                  className="h-12 border-b border-hairline/30 hover:bg-white/[0.01] transition-colors"
                />
              ))}

              {/* Event blocks */}
              {dayTimed.map((evt) => {
                const pos = getEventPosition(evt.start_at, evt.end_at)
                const color = evt.color || getEventColor(evt)
                const startTimeStr = evt.start_at.slice(11, 16)

                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="absolute left-1 right-1 rounded-lg p-1.5 border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:z-20 shadow-md group"
                    style={{
                      top: pos.top,
                      height: pos.height,
                      backgroundColor: `${color}15`,
                      borderColor: `${color}50`,
                      borderLeftWidth: '3px',
                      borderLeftColor: color,
                    }}
                  >
                    <div className="text-[10px] font-mono font-semibold text-white/90 truncate flex items-center gap-1">
                      <span>{startTimeStr}</span>
                      <span>·</span>
                      <span className="truncate">{evt.title}</span>
                    </div>
                    {evt.category && (
                      <div
                        className="text-[9px] font-mono mt-0.5 truncate"
                        style={{ color }}
                      >
                        {evt.category}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
