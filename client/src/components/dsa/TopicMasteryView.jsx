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
} from 'lucide-react'

export default function TopicMasteryView({
  topics = [],
  weakTopics = [],
  revisionQueue = {},
  onSelectProblemForPractice,
  onSelectTopic,
}) {
  const overdueItems = revisionQueue.overdue || []
  const dueTodayItems = revisionQueue.dueToday || []
  const upcomingItems = revisionQueue.upcoming || []

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      {/* 1. Spaced Repetition Due Queue Banner */}
      {(overdueItems.length > 0 || dueTodayItems.length > 0) && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-[#161208] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  Spaced Repetition: Revisions Due
                </h3>
                <span className="text-xs font-mono text-muted">
                  Revisiting problems before memory decays solidifies algorithmic patterns.
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-[#08080C]">
              {overdueItems.length + dueTodayItems.length} Due
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
            {overdueItems.concat(dueTodayItems).map((prob) => (
              <div
                key={prob.problem_id}
                className="p-4 rounded-2xl border border-amber-500/20 bg-[#0E0E14] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        prob.difficulty === 'Easy'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : prob.difficulty === 'Medium'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      Due: {prob.next_revision_due}
                    </span>
                  </div>
                  <h4 className="text-sm font-display font-bold text-white truncate">
                    {prob.title}
                  </h4>
                  <span className="text-[11px] font-mono text-muted">
                    {prob.primary_topic}
                  </span>
                </div>

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
                  className="w-full py-1.5 rounded-xl text-xs font-mono font-medium bg-amber-400 text-[#08080C] hover:bg-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Revise Now (+25 XP)</span>
                </button>
              </div>
            ))}
          </div>
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
