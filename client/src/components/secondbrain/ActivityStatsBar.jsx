import { CheckCircle2, BookOpen, Calendar, Trophy } from 'lucide-react'

export default function ActivityStatsBar({ stats = {} }) {
  const topCategory = stats.category_breakdown?.[0]?.category || 'AI Engineering'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {/* 1. Completed Activities */}
      <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted mb-2">
          <span className="text-xs font-mono">Completed This Month</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-white">
            {stats.completed_this_month || 0}
          </span>
          <span className="text-xs font-mono text-muted">
            / {stats.total_completed || 0} total
          </span>
        </div>
      </div>

      {/* 2. Learning Sessions */}
      <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted mb-2">
          <span className="text-xs font-mono">Learning & DSA</span>
          <BookOpen className="w-4 h-4 text-accent" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-white">
            {stats.learning_sessions || 0}
          </span>
          <span className="text-xs font-mono text-muted">sessions</span>
        </div>
      </div>

      {/* 3. Upcoming Scheduled */}
      <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted mb-2">
          <span className="text-xs font-mono">Upcoming Scheduled</span>
          <Calendar className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-white">
            {stats.upcoming_count || 0}
          </span>
          <span className="text-xs font-mono text-muted">planned</span>
        </div>
      </div>

      {/* 4. Top Active Category */}
      <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted mb-2">
          <span className="text-xs font-mono">Top Category</span>
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
        <div className="truncate">
          <span className="text-lg sm:text-xl font-display font-bold text-white truncate block">
            {topCategory}
          </span>
          <span className="text-xs font-mono text-muted">primary focus</span>
        </div>
      </div>
    </div>
  )
}
