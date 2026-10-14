import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAdmin } from '../../context/AdminContext'

export default function ProjectModal() {
  const {
    projectModalState,
    closeProjectModal,
    authFetch,
    triggerRefresh,
  } = useAdmin()

  const { isOpen, project } = projectModalState
  const isEditing = Boolean(project && project.id)

  const [form, setForm] = useState({
    title: '',
    category: 'AI / Automation',
    status: 'completed',
    short_description: '',
    outcome: '',
    techStack: '',
    liveLink: '',
    githubLink: '',
    image: '',
    featured: true,
    is_published: true,
    display_order: 0,
    problem: '',
    architecture: '',
    key_challenge: '',
    solution: '',
    metrics: '',
    reflection: '',
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || '',
        category: project.category || 'AI / Automation',
        status: project.status || 'completed',
        short_description: project.short_description || project.description || '',
        outcome: project.outcome || '',
        techStack: Array.isArray(project.techStack) ? project.techStack.join(', ') : '',
        liveLink: project.liveLink || project.live_link || '',
        githubLink: project.githubLink || project.github_link || '',
        image: project.image || '',
        featured: project.featured !== undefined ? Boolean(project.featured) : true,
        is_published: project.is_published !== undefined ? Boolean(project.is_published) : true,
        display_order: project.display_order || 0,
        problem: project.problem || '',
        architecture: project.architecture || '',
        key_challenge: project.key_challenge || '',
        solution: project.solution || '',
        metrics: Array.isArray(project.metrics) ? project.metrics.join('\n') : '',
        reflection: project.reflection || '',
      })
      setShowAdvanced(Boolean(project.problem || project.architecture || project.solution))
    } else {
      setForm({
        title: '',
        category: 'AI / Automation',
        status: 'completed',
        short_description: '',
        outcome: '',
        techStack: '',
        liveLink: '',
        githubLink: '',
        image: '',
        featured: true,
        is_published: true,
        display_order: 0,
        problem: '',
        architecture: '',
        key_challenge: '',
        solution: '',
        metrics: '',
        reflection: '',
      })
      setShowAdvanced(false)
    }
    setError(null)
    setConfirmDelete(false)
  }, [project, isOpen])

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      category: form.category,
      status: form.status,
      short_description: form.short_description,
      outcome: form.outcome,
      techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean),
      liveLink: form.liveLink.trim() || null,
      githubLink: form.githubLink.trim() || null,
      image: form.image.trim() || null,
      featured: Boolean(form.featured),
      is_published: Boolean(form.is_published),
      display_order: Number(form.display_order) || 0,
      problem: form.problem,
      architecture: form.architecture,
      key_challenge: form.key_challenge,
      solution: form.solution,
      metrics: form.metrics.split('\n').map(s => s.trim()).filter(Boolean),
      reflection: form.reflection,
    }

    try {
      const url = isEditing
        ? `/api/v1/admin/projects/${project.id}`
        : '/api/v1/admin/projects'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save project')
      }

      triggerRefresh()
      closeProjectModal()
    } catch (err) {
      setError(err.message || 'Error occurred while saving')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    setLoading(true)
    setError(null)

    try {
      const res = await authFetch(`/api/v1/admin/projects/${project.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete project')
      }

      triggerRefresh()
      closeProjectModal()
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
        onClick={closeProjectModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 md:p-8 z-10 my-auto shadow-2xl"
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
              <span className="text-[0.68rem] tracking-wider text-muted">ADMINISTRATION</span>
            </div>
            <h2 className="text-xl text-white font-sans font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              {isEditing ? `Edit Project: ${project.title}` : 'Add New Portfolio Project'}
            </h2>
          </div>
          <button
            onClick={closeProjectModal}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">PROJECT TITLE *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Safe NL-to-SQL"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">CATEGORY</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="AI / Automation, Full-Stack Web, etc."
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">SHORT DESCRIPTION (Summary)</label>
            <textarea
              rows={2}
              value={form.short_description}
              onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
              placeholder="Deterministic natural language to SQL assistant..."
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">KEY OUTCOME / IMPACT</label>
            <input
              type="text"
              value={form.outcome}
              onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
              placeholder="100% blocked destructive queries & schema drops..."
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">TECH STACK (comma-separated)</label>
              <input
                type="text"
                value={form.techStack}
                onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))}
                placeholder="LangGraph, FastAPI, Python, SQLite"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">IMAGE URL</label>
              <input
                type="text"
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="/projects/sql-writer.png or https://..."
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">LIVE DEMO URL</label>
              <input
                type="url"
                value={form.liveLink}
                onChange={e => setForm(f => ({ ...f, liveLink: e.target.value }))}
                placeholder="https://sqlwriter.vercel.app"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">GITHUB REPO URL</label>
              <input
                type="url"
                value={form.githubLink}
                onChange={e => setForm(f => ({ ...f, githubLink: e.target.value }))}
                placeholder="https://github.com/Manash2005/sql-writer"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#B8FF3C]"
              />
            </div>
          </div>

          {/* Visibility & Ordering Controls */}
          <div className="flex flex-wrap items-center gap-6 py-2 px-3 rounded-lg border border-white/5 bg-white/[0.02]">
            <label className="flex items-center gap-2 cursor-pointer text-white">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                className="rounded accent-[#B8FF3C]"
              />
              <span>Published (Live on site)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-white">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                className="rounded accent-[#B8FF3C]"
              />
              <span>Featured on Homepage</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Order:</span>
              <input
                type="number"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
                className="w-16 px-2 py-1 rounded bg-black/50 border border-white/10 text-white text-center"
              />
            </div>
          </div>

          {/* Deep-dive Case Study accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(a => !a)}
              className="text-xs text-muted hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5"
            >
              <span>{showAdvanced ? '▾' : '▸'}</span>
              <span>Deep-Dive Case Study Fields (Problem, Architecture, Metrics, Reflection)</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-4 rounded-xl border border-white/10 bg-black/30">
                <div>
                  <label className="block text-zinc-400 mb-1">PROBLEM STATEMENT</label>
                  <textarea
                    rows={2}
                    value={form.problem}
                    onChange={e => setForm(f => ({ ...f, problem: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">SYSTEM ARCHITECTURE</label>
                  <textarea
                    rows={2}
                    value={form.architecture}
                    onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">KEY CHALLENGE</label>
                    <textarea
                      rows={2}
                      value={form.key_challenge}
                      onChange={e => setForm(f => ({ ...f, key_challenge: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">SOLUTION</label>
                    <textarea
                      rows={2}
                      value={form.solution}
                      onChange={e => setForm(f => ({ ...f, solution: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">METRICS (one per line)</label>
                  <textarea
                    rows={2}
                    value={form.metrics}
                    onChange={e => setForm(f => ({ ...f, metrics: e.target.value }))}
                    placeholder="100% Blocked DDL Mutations&#10;22 Automated Tests Passing"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">ENGINEERING REFLECTION</label>
                  <textarea
                    rows={2}
                    value={form.reflection}
                    onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6">
            <div>
              {isEditing && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 text-xs">Sure?</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                    >
                      Yes, Delete
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
                    Delete Project
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeProjectModal}
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
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Project')}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
