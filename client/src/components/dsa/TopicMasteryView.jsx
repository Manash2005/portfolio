import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react'

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
      text: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`,
      urgency: 'upcoming',
    }
  }
}

export default function TopicMasteryView({
  topics = [],
  weakTopics = [],
  revisionQueue = {},
  onSelectProblemForPractice,
  onSelectTopic,
  onViewStats,
}) {
  const overdueItems = revisionQueue.overdue || []
  const dueTodayItems = revisionQueue.dueToday || []
  const upcomingItems = revisionQueue.upcoming || []
  const dueNowCount = overdueItems.length + dueTodayItems.length
  const totalCount = dueNowCount + upcomingItems.length

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      {/* 1. Spaced Repetition Queue Banner (Shows both Due Now and Upcoming Scheduled) */}
      {totalCount > 0 && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-[#161208] flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <span>Spaced Repetition: Revision Schedule</span>
                </h3>
                <span className="text-xs font-mono text-muted">
                  Deterministic Leitner schedule tracking retention intervals and scheduled review dates.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dueNowCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-[#08080C]">
                  {dueNowCount} Due Now
                </span>
              )}
              {upcomingItems.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/10 text-emerald-300 border border-emerald-500/30">
                  {upcomingItems.length} Scheduled
                </span>
              )}
            </div>
          </div>

          {/* Due Now Items */}
          {dueNowCount > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Ready for Revision Now
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overdueItems.concat(dueTodayItems).map((prob) => (
                  <div
                    key={prob.problem_id}
                    className="p-4 rounded-2xl border border-amber-500/20 bg-[#0E0E14] flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            prob.difficulty === 'Easy'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : prob.difficulty === 'Medium'
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-medium">
                          Due: {prob.next_revision_due}
                        </span>
                      </div>
                      <h4 className="text-sm font-display font-bold text-white truncate">
                        {prob.title}
                      </h4>
                      <span className="text-[11px] font-mono text-muted">
                        {prob.primary_topic} · Stage #{prob.repetition_count || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      {onViewStats && (
                        <button
                          onClick={() => onViewStats(prob.problem_id)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <BarChart3 className="w-3 h-3 text-accent" />
                          <span>Stats</span>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          onSelectProblemForPractice({
                            id: prob.problem_id,
                            title: prob.title,
                            canonical_url: prob.canonical_url,
                            difficulty: prob.difficulty,
                            primary_topic: prob.primary_topic,
                            platform: prob.platform,
                            estimated_solve_time: 20,
                          })
                        }
                        className="flex-1 py-1.5 rounded-xl text-xs font-mono font-medium bg-amber-400 text-[#08080C] hover:bg-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Revise Now (+25 XP)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Scheduled Items */}
          {upcomingItems.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Upcoming Scheduled Revisions
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingItems.map((prob) => {
                  const countdown = getRevisionCountdown(prob.next_revision_due)
                  return (
                    <div
                      key={prob.problem_id}
                      className="p-4 rounded-2xl border border-white/5 bg-[#0E0E14] hover:border-emerald-500/30 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              prob.difficulty === 'Easy'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : prob.difficulty === 'Medium'
                                ? 'text-amber-400 bg-amber-500/10'
                                : 'text-rose-400 bg-rose-500/10'
                            }`}
                          >
                            {prob.difficulty}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {countdown?.text}
                          </span>
                        </div>
                        <h4 className="text-sm font-display font-bold text-white truncate">
                          {prob.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted mt-0.5">
                          <span>{prob.primary_topic}</span>
                          <span>·</span>
                          <span className="text-white/80">Scheduled: {prob.next_revision_due}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        {onViewStats && (
                          <button
                            onClick={() => onViewStats(prob.problem_id)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <BarChart3 className="w-3 h-3 text-accent" />
                            <span>Stats</span>
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onSelectProblemForPractice({
                              id: prob.problem_id,
                              title: prob.title,
                              canonical_url: prob.canonical_url,
                              difficulty: prob.difficulty,
                              primary_topic: prob.primary_topic,
                              platform: prob.platform,
                              estimated_solve_time: 20,
                            })
                          }
                          className="flex-1 py-1.5 rounded-xl text-xs font-mono font-medium bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-1.5 cursor-pointer border border-hairline"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Early Practice</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Topic Mastery Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-lg font-display font-bold text-white">Topics & Question Mastery</h3>
            <span className="text-xs font-mono text-muted">
              Select any topic card below to dive directly into that topic's cataloged questions.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTopic && onSelectTopic('All')}
              className="px-4 py-2 rounded-xl border border-hairline bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>Browse All Questions ({topics.reduce((acc, t) => acc + (t.total || 0), 0) || 807}+)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => (
            <div
              key={t.topic}
              onClick={() => onSelectTopic && onSelectTopic(t.topic)}
              className="p-5 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-accent/40 hover:bg-[#12121A] transition-all flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                      t.status === 'Mastered'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : t.status === 'Progressing'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-xs font-mono font-bold text-white group-hover:text-accent transition-colors">
                    {t.masteryScore}%
                  </span>
                </div>

                <h4 className="text-base font-display font-bold text-white mb-2 group-hover:text-accent transition-colors">
                  {t.topic}
                </h4>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      t.status === 'Mastered'
                        ? 'bg-emerald-400'
                        : t.status === 'Progressing'
                        ? 'bg-blue-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.max(5, t.masteryScore)}%` }}
                  />
                </div>

                {/* Stats breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted">
                  <div>
                    Solved:{' '}
                    <span className="text-white font-medium">
                      {t.solved} / {t.total}
                    </span>
                  </div>
                  <div>
                    Independent:{' '}
                    <span className="text-accent font-medium">{t.independentlySolved}</span>
                  </div>
                  <div>
                    Needs Rev:{' '}
                    <span className={t.needsRevision > 0 ? 'text-amber-400 font-bold' : 'text-white'}>
                      {t.needsRevision}
                    </span>
                  </div>
                  <div>
                    Avg Speed:{' '}
                    <span className="text-white">
                      {t.avgDurationSeconds ? `${Math.round(t.avgDurationSeconds / 60)}m` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-hairline/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectTopic && onSelectTopic(t.topic)
                  }}
                  className="w-full py-2 rounded-xl text-xs font-mono font-medium bg-white/[0.03] group-hover:bg-accent group-hover:text-[#08080C] text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Explore Questions ({t.total})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
