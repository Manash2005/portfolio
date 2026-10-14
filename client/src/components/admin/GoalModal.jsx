import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAdmin } from '../../context/AdminContext'
import { Target, Trash2, X, Check, Calendar, Palette, Tag } from 'lucide-react'

const COLOR_PRESETS = [
  '#B8FF3C', // Lime Accent
  '#FFD13B', // Amber
  '#60A5FA', // Sky Blue
  '#F472B6', // Pink
  '#A78BFA', // Purple
  '#34D399', // Emerald
  '#FB923C', // Orange
]

const CATEGORY_PRESETS = [
  'AI Engineering',
  'DSA',
  'Project Development',
  'Career',
  'Learning',
  'System Design',
  'Personal',
]

export default function GoalModal() {
  const {
    goalModalState,
    closeGoalModal,
    authFetch,
    triggerRefresh,
  } = useAdmin()

  const { isOpen, goal } = goalModalState || {}
  const isEditing = Boolean(goal && goal.id)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'AI Engineering',
    status: 'in_progress',
    target_date: '',
    color: '#B8FF3C',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'AI Engineering',
        status: goal.status || 'in_progress',
        target_date: goal.target_date || '',
        color: goal.color || '#B8FF3C',
      })
    } else {
      setForm({
        title: '',
        description: '',
        category: 'AI Engineering',
        status: 'in_progress',
        target_date: '',
        color: '#B8FF3C',
      })
    }
    setError(null)
    setConfirmDelete(false)
  }, [goal, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Goal title is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/v1/admin/goals/${goal.id}` : '/api/v1/admin/goals'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          status: form.status,
          target_date: form.target_date || null,
          color: form.color,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save goal')
      }

      triggerRefresh()
      closeGoalModal()
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    setLoading(true)
    setError(null)

    try {
      const res = await authFetch(`/api/v1/admin/goals/${goal.id}`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete goal')
      }

      triggerRefresh()
      closeGoalModal()
    } catch (err) {
      setError(err.message || 'Failed to delete goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] text-white shadow-2xl"
          style={{ fontFamily: 'var(--font-sans, system-ui)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl border"
                style={{
                  backgroundColor: `${form.color}15`,
                  borderColor: `${form.color}40`,
                  color: form.color,
                }}
              >
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold font-display tracking-tight text-white">
                  {isEditing ? 'Edit Strategic Goal' : 'Create Strategic Goal'}
                </h3>
                <p className="text-xs font-mono text-muted">
                  {isEditing ? `ID: ${goal.id}` : 'Define milestone or long-term objective'}
                </p>
              </div>
            </div>

            <button
              onClick={closeGoalModal}
              disabled={loading}
              className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-left">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span>Goal Title</span>
                <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Master AI Engineering & Agentic Workflows"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted uppercase tracking-wider">
                Strategic Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Key outcomes, milestones, target metrics, or rationale..."
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none leading-relaxed"
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-accent" />
                  <span>Category</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="goal-category-suggestions"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. AI Engineering"
                    className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:border-accent focus:outline-none"
                  />
                  <datalist id="goal-category-suggestions">
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:border-accent focus:outline-none"
                >
                  <option value="in_progress" className="bg-[#0E0E14] text-white">In Progress</option>
                  <option value="planned" className="bg-[#0E0E14] text-white">Planned</option>
                  <option value="completed" className="bg-[#0E0E14] text-white">Completed</option>
                </select>
              </div>
            </div>

            {/* Target Date & Color Palette */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>Target Date</span>
                </label>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-accent" />
                  <span>Accent Color</span>
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-6 h-6 rounded-full border transition-transform flex items-center justify-center cursor-pointer"
                      style={{
                        backgroundColor: c,
                        borderColor: form.color === c ? '#FFFFFF' : 'transparent',
                        transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    >
                      {form.color === c && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10">
              {isEditing ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-mono">Confirm delete?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 text-xs font-mono cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 rounded text-xs text-muted hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Goal</span>
                  </button>
                )
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeGoalModal}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-accent text-black font-mono font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
