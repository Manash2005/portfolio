import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react'

export default function TopicMasteryView({
  topics = [],
  weakTopics = [],
  revisionQueue = {},
  onSelectProblemForPractice,
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
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-display font-bold text-white">Topic Mastery Breakdown</h3>
            <span className="text-xs font-mono text-muted">
              Deterministic progress based on independent solves and revision consistency.
            </span>
          </div>
          <span className="text-xs font-mono text-muted">
            {topics.length} topics tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => (
            <div
              key={t.topic}
              className="p-5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col justify-between gap-4"
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
                  <span className="text-xs font-mono font-bold text-white">
                    {t.masteryScore}%
                  </span>
                </div>

                <h4 className="text-base font-display font-bold text-white mb-2">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
