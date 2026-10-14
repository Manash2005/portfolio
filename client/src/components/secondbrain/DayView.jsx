import { useMemo } from 'react'
import { getEventColor } from '../../utils/activityStats'
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 to 22:00

export default function DayView({
  currentDate,
  events = [],
  onSelectEvent,
  onPrevDay,
  onNextDay,
}) {
  const dateStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
  }, [currentDate])

  const formattedDateTitle = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [currentDate])

  // Events for this exact date
  const dayEvents = useMemo(() => {
    return events.filter((evt) => {
      if (!evt.start_at) return false
      return evt.start_at.slice(0, 10) === dateStr
    })
  }, [events, dateStr])

  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay = []
    const timed = []
    dayEvents.forEach((evt) => {
      if (evt.all_day) allDay.push(evt)
      else timed.push(evt)
    })
    return { allDayEvents: allDay, timedEvents: timed }
  }, [dayEvents])

  return (
    <div className="w-full flex flex-col rounded-2xl border border-hairline bg-[#0B0B10] overflow-hidden shadow-2xl text-left">
      {/* Day Top Bar */}
      <div className="p-4 sm:p-5 border-b border-hairline bg-[#0E0E14] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-white">
              {formattedDateTitle}
            </h3>
            <span className="text-xs font-mono text-muted">
              {dayEvents.length} public {dayEvents.length === 1 ? 'activity' : 'activities'} logged
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevDay}
            className="p-1.5 rounded-lg border border-hairline bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextDay}
            className="p-1.5 rounded-lg border border-hairline bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* All-Day Events */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b border-hairline bg-[#0E0E14]/60 flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider">
            All-Day Activities
          </span>
          <div className="flex flex-col gap-2">
            {allDayEvents.map((evt) => {
              const color = evt.color || getEventColor(evt)
              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="p-3 rounded-xl border cursor-pointer transition-transform hover:scale-[1.01] flex items-center justify-between"
                  style={{
                    backgroundColor: `${color}14`,
                    borderColor: `${color}40`,
                    borderLeftWidth: '4px',
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-display font-semibold text-white">
                      {evt.title}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded border border-white/10 text-muted">
                      {evt.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted">{evt.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hourly Schedule */}
      <div className="flex flex-col divide-y divide-hairline">
        {dayEvents.length === 0 && (
          <div className="py-16 text-center text-muted text-xs font-mono flex flex-col items-center gap-2">
            <Clock className="w-6 h-6 opacity-40 mb-1" />
            <span>No public activities recorded for this date.</span>
          </div>
        )}

        {timedEvents.length > 0 && (
          <div className="p-4 flex flex-col gap-3">
            {timedEvents.map((evt) => {
              const color = evt.color || getEventColor(evt)
              const startStr = evt.start_at.slice(11, 16)
              const endStr = evt.end_at ? evt.end_at.slice(11, 16) : ''

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="p-4 rounded-xl border border-hairline bg-[#121218] hover:bg-[#161622] transition-all hover:scale-[1.005] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>{startStr} {endStr ? `– ${endStr}` : ''}</span>
                      <span>·</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono border"
                        style={{
                          backgroundColor: `${color}14`,
                          borderColor: `${color}40`,
                          color,
                        }}
                      >
                        {evt.category}
                      </span>
                    </div>

                    <h4 className="text-base font-display font-semibold text-white">
                      {evt.title}
                    </h4>

                    {evt.description && (
                      <p className="text-xs font-sans text-muted line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <span className="text-xs font-mono text-accent self-start sm:self-center">
                    Inspect →
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
