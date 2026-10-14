import { useMemo } from 'react'
import { getEventColor } from '../../utils/activityStats'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Tag,
  Target,
  FolderGit2,
} from 'lucide-react'

export default function AgendaView({
  events = [],
  onSelectEvent,
}) {
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Group events chronologically into Today, This Week, Later, Past
  const groups = useMemo(() => {
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const weekEnd = new Date(todayEnd)
    weekEnd.setDate(todayEnd.getDate() + 7)

    const todayEvents = []
    const thisWeekEvents = []
    const laterEvents = []
    const pastEvents = []

    events.forEach((evt) => {
      if (!evt.start_at) return
      const dateStr = evt.start_at.slice(0, 10)
      const evtDate = new Date(evt.start_at)

      if (dateStr === todayStr) {
        todayEvents.push(evt)
      } else if (evtDate > todayEnd && evtDate <= weekEnd) {
        thisWeekEvents.push(evt)
      } else if (evtDate > weekEnd) {
        laterEvents.push(evt)
      } else {
        pastEvents.push(evt)
      }
    })

    return [
      { id: 'today', title: 'Today', events: todayEvents, highlight: true },
      { id: 'this_week', title: 'Upcoming This Week', events: thisWeekEvents },
      { id: 'later', title: 'Later', events: laterEvents },
      { id: 'past', title: 'Past Activities', events: pastEvents },
    ].filter((g) => g.events.length > 0)
  }, [events, todayStr])

  const formatEventDate = (isoStr) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return isoStr.slice(0, 10)
    }
  }

  const formatEventTime = (evt) => {
    if (evt.all_day) return 'All Day'
    try {
      const start = new Date(evt.start_at)
      const startStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      if (!evt.end_at) return startStr
      const end = new Date(evt.end_at)
      const endStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return `${startStr} – ${endStr}`
    } catch {
      return ''
    }
  }

  if (events.length === 0) {
    return (
      <div className="w-full py-16 px-6 rounded-2xl border border-hairline bg-[#0B0B10] text-center flex flex-col items-center justify-center gap-3">
        <Calendar className="w-8 h-8 text-muted/50 mb-1" />
        <h4 className="text-base font-display font-semibold text-white">No Public Events Found</h4>
        <p className="text-xs font-mono text-muted max-w-sm">
          No activities match your current search or category filters. Try resetting the filters above.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      {groups.map((grp) => (
        <section key={grp.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 select-none">
            <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
              <span>{grp.title}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            </h3>
            <span className="text-xs font-mono text-muted/50">
              ({grp.events.length})
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {grp.events.map((evt) => {
              const color = evt.color || getEventColor(evt)
              const timeStr = formatEventTime(evt)

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="w-full p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] hover:bg-[#12121A] transition-all hover:scale-[1.005] hover:border-white/15 cursor-pointer shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: color,
                  }}
                >
                  {/* Left: Date + Title + Badges */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {/* Date Pill */}
                      <span className="text-white/90 font-medium">
                        {formatEventDate(evt.start_at)}
                      </span>

                      {/* Time */}
                      {timeStr && (
                        <>
                          <span className="text-muted/60">·</span>
                          <span className="text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3 text-accent" />
                            <span>{timeStr}</span>
                          </span>
                        </>
                      )}

                      {/* Category Pill */}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono border"
                        style={{
                          backgroundColor: `${color}14`,
                          borderColor: `${color}40`,
                          color,
                        }}
                      >
                        {evt.category}
                      </span>

                      {/* Status */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          evt.status === 'Completed'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : evt.status === 'In Progress'
                            ? 'text-blue-400 bg-blue-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base sm:text-lg font-display font-semibold text-white group-hover:text-accent transition-colors truncate">
                      {evt.title}
                    </h4>

                    {/* Description snippet */}
                    {evt.description && (
                      <p className="text-xs font-sans text-muted line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    {/* Tags & Relationships */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {evt.goal_title && (
                        <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                          <Target className="w-3 h-3 text-accent" />
                          <span>{evt.goal_title}</span>
                        </span>
                      )}
                      {evt.project_title && (
                        <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                          <FolderGit2 className="w-3 h-3 text-accent" />
                          <span>{evt.project_title}</span>
                        </span>
                      )}
                      {evt.tags && evt.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/5 text-muted"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Quick Action / Status Icon */}
                  <div className="sm:self-center shrink-0 flex items-center gap-3">
                    {evt.external_url && (
                      <a
                        href={evt.external_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl border border-hairline bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors"
                        title="Open external resource"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-xs font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                      View details →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
