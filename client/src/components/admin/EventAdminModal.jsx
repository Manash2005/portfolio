import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAdmin } from '../../context/AdminContext'

const PRESET_COLORS = [
  { name: 'Neon Green', hex: '#B8FF3C' },
  { name: 'Yellow', hex: '#FFD13B' },
  { name: 'Blue', hex: '#60A5FA' },
  { name: 'Purple', hex: '#A78BFA' },
  { name: 'Pink', hex: '#F472B6' },
  { name: 'Red / Alert', hex: '#FF4D4D' },
  { name: 'Muted Gray', hex: '#9CA3AF' },
]

export default function EventAdminModal() {
  const { eventModalState, closeEventModal, authFetch, triggerRefresh } = useAdmin()
  const { isOpen, event } = eventModalState
  const isEditing = Boolean(event && event.id)

  const [form, setForm] = useState({
    title: '',
    category: 'Learning',
    status: 'Planned',
    start_at: '',
    end_at: '',
    all_day: false,
    visibility: 'Public',
    show_on_portfolio_heatmap: false,
    color: '#B8FF3C',
    tags: '',
    priority: 'medium',
    location: '',
    external_url: '',
    description: '',
    private_notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Format date string for datetime-local input (YYYY-MM-DDTHH:mm)
  const toLocalInput = (isoStr) => {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return ''
    }
  }

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        category: event.category || 'Learning',
        status: event.status || 'Planned',
        start_at: toLocalInput(event.start_at),
        end_at: toLocalInput(event.end_at),
        all_day: Boolean(event.all_day),
        visibility: event.visibility || 'Public',
        show_on_portfolio_heatmap: Boolean(event.show_on_portfolio_heatmap),
        color: event.color || '#B8FF3C',
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
        priority: event.priority || 'medium',
        location: event.location || '',
        external_url: event.external_url || '',
        description: event.description || '',
        private_notes: event.private_notes || '',
      })
    } else {
      const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      setForm({
        title: '',
        category: 'Learning',
        status: 'Planned',
        start_at: toLocalInput(now.toISOString()),
        end_at: toLocalInput(oneHourLater.toISOString()),
        all_day: false,
        visibility: 'Public',
        show_on_portfolio_heatmap: false,
        color: '#B8FF3C',
        tags: '',
        priority: 'medium',
        location: '',
        external_url: '',
        description: '',
        private_notes: '',
      })
    }
    setError(null)
    setConfirmDelete(false)
  }, [event, isOpen])

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.start_at || !form.end_at) {
      setError('Title, Start Date/Time, and End Date/Time are required.')
      return
    }

    setLoading(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      category: form.category,
      status: form.status,
      start_at: form.start_at,
      end_at: form.end_at,
      all_day: Boolean(form.all_day),
      visibility: form.visibility,
      show_on_portfolio_heatmap: Boolean(form.show_on_portfolio_heatmap),
      color: form.color,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      priority: form.priority,
      location: form.location.trim() || null,
      external_url: form.external_url.trim() || null,
      description: form.description.trim() || '',
      private_notes: form.private_notes.trim() || null,
    }

    try {
      const url = isEditing
        ? `/api/v1/admin/events/${event.id}`
        : '/api/v1/admin/events'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save event')
      }

      triggerRefresh()
      closeEventModal()
    } catch (err) {
      setError(err.message || 'Error occurred while saving event')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    setLoading(true)
    setError(null)

    try {
      const res = await authFetch(`/api/v1/admin/events/${event.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete event')
      }

      triggerRefresh()
      closeEventModal()
    } catch (err) {
      setError(err.message || 'Error occurred while deleting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeEventModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 md:p-8 z-10 my-auto shadow-2xl"
        style={{
          background: '#0D0F17',
          borderColor: 'var(--color-hairline)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#B8FF3C' }} />
              <span className="text-[0.68rem] tracking-wider text-muted">SECOND BRAIN CALENDAR</span>
            </div>
            <h2 className="text-xl text-white font-sans font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              {isEditing ? `Edit Event: ${event.title}` : 'Add New Calendar Event'}
            </h2>
          </div>
          <button
            onClick={closeEventModal}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">EVENT TITLE *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. System Design Mock Round"
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">CATEGORY</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              >
                <option value="Learning">Learning</option>
                <option value="Project Development">Project Development</option>
                <option value="Competitive Programming">Competitive Programming</option>
                <option value="System Design">System Design</option>
                <option value="Interview Preparation">Interview Preparation</option>
                <option value="Career">Career</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">STATUS</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Missed">Missed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">START DATE & TIME *</label>
              <input
                type="datetime-local"
                required
                value={form.start_at}
                onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">END DATE & TIME *</label>
              <input
                type="datetime-local"
                required
                value={form.end_at}
                onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
          </div>

          {/* Visibility & Heatmap Toggles */}
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="checkbox"
                  checked={form.all_day}
                  onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))}
                  className="rounded accent-[#B8FF3C]"
                />
                <span>All Day Event</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Visibility:</span>
                <select
                  value={form.visibility}
                  onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                  className="px-2 py-1 rounded bg-black/50 border border-white/10 text-white"
                >
                  <option value="Public">Public (Visible to all visitors)</option>
                  <option value="Private">Private (Strictly shielded)</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-white pt-2 border-t border-white/5">
              <input
                type="checkbox"
                checked={form.show_on_portfolio_heatmap}
                onChange={e => setForm(f => ({ ...f, show_on_portfolio_heatmap: e.target.checked }))}
                className="rounded accent-[#B8FF3C] mt-0.5"
              />
              <div>
                <span className="font-semibold text-white">Show on Portfolio Activity Heatmap</span>
                <p className="text-[0.68rem] text-muted">
                  When completed and marked public, this event generates an interactive activity dot & building on the skyline heatmap.
                </p>
              </div>
            </label>
          </div>

          {/* Color & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">COLOR ACCENT</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c.hex }))}
                    className="w-5 h-5 rounded-full border cursor-pointer transition-transform hover:scale-110"
                    style={{
                      background: c.hex,
                      borderColor: form.color === c.hex ? '#FFFFFF' : 'transparent',
                      transform: form.color === c.hex ? 'scale(1.2)' : 'none',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">TAGS (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="DSA, System Design, Mock"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">PUBLIC DESCRIPTION</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What was covered or accomplished..."
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
            />
          </div>

          {/* Confidential Private Notes Field */}
          <div className="p-3.5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 text-xs">🔒</span>
              <label className="text-yellow-300 font-semibold text-xs">CONFIDENTIAL PRIVATE NOTES</label>
              <span className="text-[0.65rem] text-yellow-400/80 bg-yellow-400/10 px-2 py-0.5 rounded">
                Admin Eyes Only
              </span>
            </div>
            <p className="text-[0.68rem] text-zinc-400 mb-2">
              Strictly shielded at the SQL query level. Never transmitted to unauthenticated visitors or public APIs.
            </p>
            <textarea
              rows={3}
              value={form.private_notes}
              onChange={e => setForm(f => ({ ...f, private_notes: e.target.value }))}
              placeholder="Private takeaways, mistakes to review, personal study notes..."
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-yellow-500/20 text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6">
            <div>
              {isEditing && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 text-xs">Delete?</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Delete Event
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeEventModal}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: loading ? 'rgba(184, 255, 60, 0.4)' : '#B8FF3C',
                  color: '#08080C',
                }}
              >
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Event')}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
