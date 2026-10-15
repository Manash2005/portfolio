import { useState } from 'react'
import { FolderGit2, ExternalLink, Plus, Edit2, Trash2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'

function getTechList(proj) {
  if (!proj) return []
  const raw = proj.tech_stack ?? proj.techStack
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // not JSON string
    }
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

export default function GoalsAndProjectsPanel({ projects = [] }) {
  const {
    isAdmin,
    openCreateProject,
    openEditProject,
    authFetch,
    triggerRefresh,
  } = useAdmin()

  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleDelete = async (e, proj) => {
    e.stopPropagation()
    setDeletingId(proj.id)
    setErrorMsg(null)

    try {
      const res = await authFetch(`/api/v1/admin/projects/${proj.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete project')
      }
      setConfirmDeleteId(null)
      triggerRefresh()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  if (projects.length === 0 && !isAdmin) return null

  return (
    <div className="w-full flex flex-col gap-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-accent/10 text-accent">
            <FolderGit2 className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-white">
                Projects Connected to Portfolio
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase tracking-wider">
                Direct Sync
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Projects added or updated here reflect immediately on the main portfolio page and projects directory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted/60">{projects.length} project{projects.length === 1 ? '' : 's'}</span>
          {isAdmin && (
            <button
              onClick={openCreateProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-[#08080C] hover:opacity-90 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              title="Create a new portfolio project"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-[#0E0E14] text-center flex flex-col items-center justify-center gap-2">
          <p className="text-xs font-mono text-muted">No projects in portfolio database yet.</p>
          {isAdmin && (
            <button
              onClick={openCreateProject}
              className="text-xs font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add your first project to reflect on the main page</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const techList = getTechList(proj)
            const liveUrl = proj.live_link || proj.liveLink
            const ghUrl = proj.github_link || proj.githubLink

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-accent/40 transition-all shadow-md flex flex-col justify-between gap-3 relative group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                      {proj.category || 'Project'}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditProject(proj)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === proj.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              disabled={deletingId === proj.id}
                              onClick={(e) => handleDelete(e, proj)}
                              className="px-2 py-1 rounded bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer hover:bg-red-600 transition-colors"
                            >
                              {deletingId === proj.id ? '...' : 'Confirm'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDeleteId(null)
                              }}
                              className="px-1.5 py-1 rounded bg-white/10 text-muted text-[10px] font-mono cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDeleteId(proj.id)
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-display font-bold text-white">
                      {proj.title}
                    </h4>

                    <div className="flex items-center gap-2 shrink-0">
                      {liveUrl && (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {ghUrl && (
                        <a
                          href={ghUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-muted hover:text-white flex items-center gap-1"
                        >
                          <span>Code</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.description && (
                    <p className="text-xs font-sans text-muted leading-relaxed line-clamp-2 mt-1.5">
                      {proj.description}
                    </p>
                  )}
                </div>

                {techList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-white/5">
                    {techList.slice(0, 5).map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/5 text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
