import { useState } from 'react'
import {
  Search,
  Filter,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Clock,
  Star,
  BookOpen,
  Plus,
  X,
  Link2,
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'

export const TOPIC_LIST = [
  'All',
  'Arrays',
  'Strings',
  'Two Pointers',
  'Sliding Window',
  'Stacks',
  'Monotonic Stack',
  'Binary Search',
  'Linked Lists',
  'Trees',
  'Binary Search Trees',
  'Tries',
  'Heaps',
  'Backtracking',
  'Graph Traversal',
  'Topological Sorting',
  'Shortest Paths',
  'Union-Find',
  'Dynamic Programming',
  'Greedy',
  'Segment Trees',
  'Bitmask DP',
]

export default function QuestionBank({
  problems = [],
  pagination = {},
  filters = {},
  onFilterChange,
  onPageChange,
  onSelectProblemForPractice,
  loading = false,
}) {
  const { isAdmin, authFetch } = useAdmin()
  const [selectedTopic, setSelectedTopic] = useState(filters.topic || 'All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addSuccess, setAddSuccess] = useState(null)
  const [addForm, setAddForm] = useState({
    url: '',
    title: '',
    platform: 'leetcode',
    difficulty: 'Medium',
    primary_topic: 'Arrays',
  })

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic)
    onFilterChange({ ...filters, topic, page: 1 })
  }

  const handleAddProblem = async (e) => {
    e.preventDefault()
    if (!addForm.url.trim() && !addForm.title.trim()) {
      setAddError('Please provide a LeetCode/GFG problem URL or title')
      return
    }

    setAddLoading(true)
    setAddError(null)
    setAddSuccess(null)

    try {
      const res = await authFetch('/api/v1/dsa/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add problem')
      }

      setAddSuccess(`Added "${json.problem?.title || addForm.title}" to catalog!`)
      setAddForm({ url: '', title: '', platform: 'leetcode', difficulty: 'Medium', primary_topic: 'Arrays' })
      setTimeout(() => {
        setIsAddModalOpen(false)
        setAddSuccess(null)
      }, 1200)

      onFilterChange({ ...filters })
    } catch (err) {
      setAddError(err.message || 'Failed to add problem')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Question Bank Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <span>Master Question Bank</span>
          </h3>
          <p className="text-xs font-mono text-muted mt-0.5">
            Curated LeetCode & GeeksforGeeks problems organized by algorithmic patterns and data structures.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-muted bg-[#12121A] px-3 py-1.5 rounded-xl border border-hairline">
            <span>{pagination.total || problems.length} Problems Catalogued</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-black font-mono font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
              title="Add any LeetCode or GeeksforGeeks problem to catalog"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Problem</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Problem Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0E0E14] text-white p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-display font-bold text-white">Add Problem to Catalog</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-muted hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAddProblem} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-muted uppercase">LeetCode or GFG Problem URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://leetcode.com/problems/trapping-rain-water/"
                  value={addForm.url}
                  onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-muted uppercase">Problem Title (Optional if URL provided)</label>
                <input
                  type="text"
                  placeholder="e.g. Trapping Rain Water"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-muted uppercase">Difficulty</label>
                  <select
                    value={addForm.difficulty}
                    onChange={(e) => setAddForm({ ...addForm, difficulty: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-muted uppercase">Primary Topic</label>
                  <select
                    value={addForm.primary_topic}
                    onChange={(e) => setAddForm({ ...addForm, primary_topic: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white"
                  >
                    {TOPIC_LIST.filter(t => t !== 'All').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono text-muted hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-1.5 rounded-xl bg-accent text-black font-mono font-semibold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addLoading ? 'Adding...' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Search problems, topics, patterns..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Platform selector */}
          <select
            value={filters.platform || 'all'}
            onChange={(e) => onFilterChange({ ...filters, platform: e.target.value, page: 1 })}
            className="px-3 py-2.5 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="leetcode">LeetCode</option>
            <option value="geeksforgeeks">GeeksforGeeks</option>
            <option value="interviewbit">InterviewBit</option>
            <option value="hackerrank">HackerRank</option>
            <option value="other">Other Platforms</option>
          </select>

          {/* Difficulty selector */}
          <select
            value={filters.difficulty || 'all'}
            onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value, page: 1 })}
            className="px-3 py-2.5 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Solved Status */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value, page: 1 })}
            className="px-3 py-2.5 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="unsolved">Unsolved</option>
            <option value="solved">Solved</option>
            <option value="revision_due">Revision Due</option>
          </select>

          {/* Sort order */}
          <select
            value={filters.sort || 'priority'}
            onChange={(e) => onFilterChange({ ...filters, sort: e.target.value, page: 1 })}
            className="px-3 py-2.5 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-accent cursor-pointer"
          >
            <option value="priority">Priority: Retention First</option>
            <option value="difficulty">Difficulty (Easy → Hard)</option>
            <option value="recent">Recently Solved</option>
            <option value="least_recent">Least Recently Solved</option>
            <option value="weakness">Personal Weakness</option>
          </select>
        </div>

        {/* 2. Topic Chips Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-hairline">
          {TOPIC_LIST.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                (filters.topic || 'All') === topic
                  ? 'bg-accent text-[#08080C] font-semibold'
                  : 'bg-white/[0.03] text-muted hover:text-white border border-hairline'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Problem Cards Grid */}
      {loading ? (
        <div className="w-full py-20 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-muted">Loading question catalog...</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="w-full py-16 px-4 rounded-2xl border border-hairline bg-[#0E0E14] text-center flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-muted" />
          <h4 className="text-sm font-display font-medium text-white">No problems found</h4>
          <p className="text-xs font-mono text-muted">Try broadening your search or resetting filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((prob) => {
            const isSolved = prob.is_solved
            const isIndep = prob.is_independent_solve
            const isDue = prob.is_revision_due

            return (
              <div
                key={prob.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 text-left ${
                  isDue
                    ? 'border-amber-500/40 bg-[#161208]/40 hover:border-amber-400/60'
                    : isSolved
                    ? 'border-hairline bg-[#0E0E14] hover:border-white/20'
                    : 'border-hairline bg-[#0E0E14] hover:border-accent/40'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          prob.difficulty === 'Easy'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : prob.difficulty === 'Medium'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-hairline uppercase">
                        {prob.platform}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-muted border border-white/5">
                        {prob.primary_topic}
                      </span>
                    </div>

                    {/* Mastery Badge */}
                    <span
                      title={prob.mastery_explanation}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                        prob.mastery_level === 'Strong'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : prob.mastery_level === 'Familiar'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : prob.mastery_level === 'Needs Revision'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : prob.mastery_level === 'Practicing'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-white/5 text-muted border border-hairline'
                      }`}
                    >
                      {prob.mastery_level === 'Strong' && <Star className="w-2.5 h-2.5 fill-current" />}
                      {prob.mastery_level === 'Needs Revision' && <RotateCcw className="w-2.5 h-2.5" />}
                      <span>{prob.mastery_level}</span>
                    </span>
                  </div>

                  {/* Title & canonical link */}
                  <div className="flex items-start justify-between gap-3 mt-1">
                    <h3 className="text-base font-display font-bold text-white hover:text-accent transition-colors">
                      {prob.title}
                    </h3>
                    <a
                      href={prob.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open canonical problem page"
                      className="text-muted hover:text-white p-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Patterns */}
                  {prob.patterns && prob.patterns.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {prob.patterns.map((pt, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.02] text-[#B0B0C0] border border-white/5"
                        >
                          {pt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer details & practice launch */}
                <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs font-mono">
                  <div className="flex items-center gap-3 text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-accent" />
                      <span>~{prob.estimated_solve_time || 20}m</span>
                    </span>
                    {isSolved && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isIndep ? 'Independent' : 'Assisted'}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectProblemForPractice(prob)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-accent text-[#08080C] hover:opacity-90 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Practice</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-hairline bg-[#0E0E14] text-xs font-mono">
          <span className="text-muted">
            Page <span className="text-white font-medium">{pagination.page}</span> of{' '}
            <span className="text-white font-medium">{pagination.totalPages}</span> ({pagination.total}{' '}
            problems)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-hairline bg-white/[0.03] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-hairline bg-white/[0.03] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
