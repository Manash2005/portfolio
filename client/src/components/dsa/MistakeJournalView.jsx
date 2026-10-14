import { useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Filter,
  ExternalLink,
  Tag,
  CheckCircle2,
  TrendingDown,
  Lightbulb,
} from 'lucide-react'

export default function MistakeJournalView({
  mistakes = [],
  analytics = {},
  onSelectProblemForPractice,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categoryList = analytics.availableCategories || []
  const topPattern = analytics.topPattern

  const filteredMistakes =
    selectedCategory === 'all'
      ? mistakes
      : mistakes.filter((m) => m.category === selectedCategory)

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* 1. Recurring Mistake Spotlight */}
      {topPattern && (
        <div className="p-6 rounded-3xl border border-rose-500/30 bg-[#160E0E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 shrink-0">
              <TrendingDown className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 font-bold uppercase">
                  Recurring Pattern Identified
                </span>
                <span className="text-xs font-mono text-muted">
                  {topPattern.percentage}% of your logged errors
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-white mt-0.5">
                {topPattern.label} ({topPattern.count} times)
              </h3>
              <p className="text-xs font-mono text-muted max-w-xl mt-1">
                This is your most frequent failure mode during practice. Dedicate extra review time to edge case checks before submitting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-accent text-[#08080C] font-bold'
              : 'bg-[#0E0E14] text-muted hover:text-white border border-hairline'
          }`}
        >
          All ({mistakes.length})
        </button>
        {categoryList.map((cat) => {
          const count =
            analytics.categoryCounts?.find((c) => c.category === cat.id)?.count || 0
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-accent text-[#08080C] font-bold'
                  : 'bg-[#0E0E14] text-muted hover:text-white border border-hairline'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* 3. Mistake Entries List */}
      {filteredMistakes.length === 0 ? (
        <div className="w-full py-16 px-4 rounded-2xl border border-hairline bg-[#0E0E14] text-center flex flex-col items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-muted" />
          <h4 className="text-sm font-display font-medium text-white">No mistakes recorded</h4>
          <p className="text-xs font-mono text-muted max-w-md">
            When completing an attempt in the Practice Arena, check "Log to Mistake Journal" to capture edge cases and conceptual traps.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMistakes.map((entry) => {
            const catMeta = categoryList.find((c) => c.id === entry.category)
            const dateStr = entry.created_at ? entry.created_at.split(' ')[0] : ''

            return (
              <div
                key={entry.id}
                className="p-5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-medium border"
                      style={{
                        backgroundColor: `${catMeta?.color || '#8B5CF6'}15`,
                        color: catMeta?.color || '#8B5CF6',
                        borderColor: `${catMeta?.color || '#8B5CF6'}30`,
                      }}
                    >
                      {catMeta?.label || entry.category}
                    </span>
                    <span className="text-[10px] font-mono text-muted">{dateStr}</span>
                  </div>

                  <h4 className="text-base font-display font-bold text-white mt-0.5">
                    {entry.problem_title}
                  </h4>

                  <div className="p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/15 flex flex-col gap-1 text-xs font-mono">
                    <span className="text-[10px] text-rose-400 font-semibold uppercase">
                      What went wrong:
                    </span>
                    <span className="text-white/90">{entry.mistake_description}</span>
                  </div>

                  {entry.lesson_learned && (
                    <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 flex flex-col gap-1 text-xs font-mono">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        <span>Lesson for next time:</span>
                      </span>
                      <span className="text-white/90">{entry.lesson_learned}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs font-mono">
                  <span className="text-muted">{entry.primary_topic}</span>
                  <a
                    href={entry.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-white flex items-center gap-1"
                  >
                    <span>Problem Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
