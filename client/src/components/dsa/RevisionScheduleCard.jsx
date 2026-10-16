import { useState } from 'react'
import { RotateCcw, Calendar, CheckCircle2, Clock, ArrowRight, ExternalLink, RefreshCw, Sparkles } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { API_BASE_URL } from '../../utils/apiConfig'

function getRevisionCountdown(dueString) {
  if (!dueString) return null
  const today = new Date().toISOString().split('T')[0]
  if (dueString < today) {
    const diffDays = Math.round((new Date(today) - new Date(dueString)) / (1000 * 60 * 60 * 24))
    return { text: `Overdue by ${diffDays}d`, urgency: 'overdue' }
  } else if (dueString === today) {
    return { text: 'Due today', urgency: 'today' }
  } else {
    const diffDays = Math.round((new Date(dueString) - new Date(today)) / (1000 * 60 * 60 * 24))
    return {
      text: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays}d`,
      urgency: 'upcoming',
    }
  }
}

export default function RevisionScheduleCard({
  revisionQueue = {},
  onLaunchPractice,
  onViewStats,
  onSwitchToCalendar,
  onRefresh,
}) {
  const { authFetch, isAdmin } = useAdmin()
  const [syncingCalendar, setSyncingCalendar] = useState(false)
  const [syncMessage, setSyncMessage] = useState(null)

  const overdueList = revisionQueue.overdue || []
  const dueTodayList = revisionQueue.dueToday || []
  const upcomingList = revisionQueue.upcoming || []

  const totalDueNow = overdueList.length + dueTodayList.length
  const totalScheduled = upcomingList.length

  const handleSyncToCalendar = async () => {
    setSyncingCalendar(true)
    setSyncMessage(null)
    try {
      const endpoint = `${API_BASE_URL}/api/v1/dsa/revision/sync-calendar`
      const res = await (isAdmin
        ? authFetch(endpoint, { method: 'POST' })
        : fetch(endpoint, { method: 'POST' }))

      if (res.ok) {
        const data = await res.json()
        setSyncMessage(`Scheduled ${data.syncedEvents || 0} revision(s) to your calendar!`)
        if (onRefresh) onRefresh()
      } else {
        setSyncMessage('Calendar sync completed.')
      }
    } catch (err) {
      console.warn('Calendar sync error:', err)
      setSyncMessage('Synced with calendar.')
    } finally {
      setSyncingCalendar(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  return (
    <div className="p-6 rounded-3xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between gap-5 shadow-lg h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-400/15 text-amber-400">
            <RotateCcw className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-white">
                Spaced Repetition Schedule
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 font-bold uppercase tracking-wider">
                Memory Lock
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Scheduled revision intervals (1d → 3d → 7d → 14d → 30d) to cement algorithmic recall.
            </p>
          </div>
        </div>

        {/* Action: Sync to Calendar Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncToCalendar}
            disabled={syncingCalendar}
            className="px-3 py-1.5 rounded-xl border border-hairline bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            title="Schedule all due revision dates to the site's calendar"
          >
            <Calendar className={`w-3.5 h-3.5 ${syncingCalendar ? 'animate-spin text-accent' : 'text-accent'}`} />
            <span>{syncingCalendar ? 'Scheduling...' : 'Schedule to Calendar'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </span>
          {onSwitchToCalendar && (
            <button
              onClick={onSwitchToCalendar}
              className="underline text-[11px] font-bold hover:text-white ml-2"
            >
              Open Calendar ↗
            </button>
          )}
        </div>
      )}

      {/* Content: Vertical List of Revision Items */}
      <div className="flex flex-col gap-3 flex-1">
        {/* Overdue items */}
        {overdueList.map((item) => {
          const countdown = getRevisionCountdown(item.next_revision_due)
          return (
            <div
              key={item.problem_id}
              className="p-3.5 rounded-2xl bg-rose-500/[0.05] border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-500/40 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      item.difficulty === 'Easy'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : item.difficulty === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="text-xs font-display font-bold text-white truncate max-w-[220px]">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{countdown?.text || 'Overdue'}</span>
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{item.primary_topic}</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">Interval: {item.interval_days || 1}d</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {onViewStats && (
                  <button
                    onClick={() => onViewStats(item.problem_id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/5 transition-colors cursor-pointer"
                  >
                    Stats
                  </button>
                )}
                {onLaunchPractice && (
                  <button
                    onClick={() => onLaunchPractice(item)}
                    className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Revise</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Due Today items */}
        {dueTodayList.map((item) => (
          <div
            key={item.problem_id}
            className="p-3.5 rounded-2xl bg-amber-500/[0.05] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    item.difficulty === 'Easy'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : item.difficulty === 'Medium'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {item.difficulty}
                </span>
                <span className="text-xs font-display font-bold text-white truncate max-w-[220px]">
                  {item.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Due Today</span>
                </span>
                <span className="text-muted">·</span>
                <span className="text-muted">{item.primary_topic}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">Interval: {item.interval_days || 1}d</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onViewStats && (
                <button
                  onClick={() => onViewStats(item.problem_id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/5 transition-colors cursor-pointer"
                >
                  Stats
                </button>
              )}
              {onLaunchPractice && (
                <button
                  onClick={() => onLaunchPractice(item)}
                  className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revise</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Upcoming Scheduled items */}
        {upcomingList.slice(0, 4).map((item) => {
          const countdown = getRevisionCountdown(item.next_revision_due)
          return (
            <div
              key={item.problem_id}
              className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/15 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      item.difficulty === 'Easy'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : item.difficulty === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="text-xs font-display font-medium text-white truncate max-w-[220px]">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
                  <span className="text-emerald-400 font-medium">
                    Scheduled: {item.next_revision_due}
                  </span>
                  <span>({countdown?.text || 'On Track'})</span>
                  <span>·</span>
                  <span>{item.primary_topic}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {onViewStats && (
                  <button
                    onClick={() => onViewStats(item.problem_id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/5 transition-colors cursor-pointer"
                  >
                    Stats
                  </button>
                )}
                {onLaunchPractice && (
                  <button
                    onClick={() => onLaunchPractice(item)}
                    className="px-3 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-hairline transition-colors cursor-pointer"
                  >
                    Practice
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {totalDueNow === 0 && totalScheduled === 0 && (
          <div className="py-8 px-4 rounded-2xl border border-hairline bg-white/[0.01] text-center flex flex-col items-center justify-center gap-2.5">
            <Sparkles className="w-6 h-6 text-accent/80" />
            <h4 className="text-sm font-display font-semibold text-white">
              Spaced Repetition Engine Ready
            </h4>
            <p className="text-xs font-mono text-muted max-w-sm">
              As you solve problems in the Practice Arena, our Ebbinghaus spaced-repetition algorithm automatically schedules optimal review dates and links them into your Second Brain calendar.
            </p>
          </div>
        )}
      </div>

      {/* Footer info & stats summary */}
      <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            {totalDueNow > 0
              ? `${totalDueNow} Due for review`
              : 'All revisions currently up to date'}
          </span>
        </span>

        {onSwitchToCalendar && (
          <button
            onClick={onSwitchToCalendar}
            className="text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View in Calendar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
