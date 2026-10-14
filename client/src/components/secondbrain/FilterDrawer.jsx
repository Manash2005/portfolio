import { RotateCcw } from 'lucide-react'

const CATEGORIES = [
  'All',
  'AI Engineering',
  'DSA',
  'Competitive Programming',
  'System Design',
  'Project Development',
  'Learning',
  'Interview Preparation',
  'Career',
  'Hackathon',
]

const STATUSES = ['All', 'Planned', 'In Progress', 'Completed']

export default function FilterDrawer({
  isOpen,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  resultCount,
}) {
  if (!isOpen) return null

  const hasActiveFilters = selectedCategory !== 'All' || selectedStatus !== 'All'

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14]/90 backdrop-blur-md flex flex-col gap-4 text-left transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
            Filter Public Events
          </span>
          <span className="text-xs font-mono text-accent">
            ({resultCount} {resultCount === 1 ? 'match' : 'matches'})
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs font-mono text-muted hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-[11px] font-mono text-muted mb-2">
          Category:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-[#08080C] font-semibold shadow-sm'
                    : 'bg-white/5 border border-white/5 text-muted hover:text-white hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Statuses */}
      <div>
        <label className="block text-[11px] font-mono text-muted mb-2">
          Status:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((st) => {
            const isSelected = selectedStatus === st
            return (
              <button
                key={st}
                onClick={() => onStatusChange(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-[#08080C] font-semibold shadow-sm'
                    : 'bg-white/5 border border-white/5 text-muted hover:text-white hover:border-white/10'
                }`}
              >
                {st}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
