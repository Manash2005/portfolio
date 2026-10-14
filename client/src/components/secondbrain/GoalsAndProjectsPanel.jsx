import { useState } from 'react'
import { Target, FolderGit2, CheckCircle2, Clock, ExternalLink, Plus, Edit2, Trash2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'

export default function GoalsAndProjectsPanel({ goals = [], projects = [] }) {
  const {
    isAdmin,
    openCreateGoal,
    openEditGoal,
    openCreateProject,
    openEditProject,
    authFetch,
    triggerRefresh,
  } = useAdmin()

  const [deletingGoalId, setDeletingGoalId] = useState(null)
  const [goalActionError, setGoalActionError] = useState(null)

  const handleDeleteGoal = async (e, goal) => {
    e.stopPropagation()
    const confirmed = window.confirm(`Are you sure you want to delete strategic goal "${goal.title}"? Any linked projects and events will be unlinked.`)
    if (!confirmed) return

    setDeletingGoalId(goal.id)
    setGoalActionError(null)

    try {
      const res = await authFetch(`/api/v1/admin/goals/${goal.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete goal')
      }
      triggerRefresh()
    } catch (err) {
      setGoalActionError(err.message || 'Failed to delete goal')
    } finally {
      setDeletingGoalId(null)
    }
  }

  if (goals.length === 0 && projects.length === 0 && !isAdmin) return null

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
      {/* 1. Strategic Goals Column */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <span>Active Strategic Goals</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted/60">{goals.length} goals</span>
            {isAdmin && (
              <button
                onClick={openCreateGoal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
                title="Create a new strategic goal"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Goal</span>
              </button>
            )}
          </div>
        </div>

        {goalActionError && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            {goalActionError}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {goals.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-[#0E0E14] text-center flex flex-col items-center justify-center gap-2">
              <p className="text-xs font-mono text-muted">No strategic goals defined yet.</p>
              {isAdmin && (
                <button
                  onClick={openCreateGoal}
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create your first strategic goal</span>
                </button>
              )}
            </div>
          ) : (
            goals.map((goal) => {
              const isCompleted = goal.status === 'completed'
              const percent = goal.total_events > 0
                ? Math.round((goal.completed_events / goal.total_events) * 100)
                : 0

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-white/15 transition-all shadow-md flex flex-col gap-2.5 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono border"
                        style={{
                          borderColor: `${goal.color || '#B8FF3C'}40`,
                          backgroundColor: `${goal.color || '#B8FF3C'}10`,
                          color: goal.color || '#B8FF3C',
                        }}
                      >
                        {goal.category}
                      </span>
                      <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-accent" />
                        )}
                        <span>{goal.status}</span>
                      </span>
                    </div>

                    {/* Admin Action Controls */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditGoal(goal)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
                          title="Edit Goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteGoal(e, goal)}
                          disabled={deletingGoalId === goal.id}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="text-base font-display font-semibold text-white">
                    {goal.title}
                  </h4>

                  {goal.description && (
                    <p className="text-xs font-sans text-muted leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {goal.total_events > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                        <span>Logged Progress</span>
                        <span>{goal.completed_events} / {goal.total_events} events ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: goal.color || '#B8FF3C',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {goal.target_date && (
                    <div className="text-[10px] font-mono text-muted/60 mt-0.5">
                      Target: {goal.target_date}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Connected Projects Column */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-accent" />
            <span>Connected Projects</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted/60">{projects.length} projects</span>
            {isAdmin && (
              <button
                onClick={openCreateProject}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
                title="Create a new project"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-white/15 transition-all shadow-md flex flex-col gap-2 relative group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-accent font-semibold">
                  {proj.category}
                </span>
                <div className="flex items-center gap-2">
                  {proj.goal_title && (
                    <span className="text-[10px] font-mono text-muted truncate max-w-[180px]">
                      Goal: {proj.goal_title}
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => openEditProject(proj)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-display font-semibold text-white">
                  {proj.title}
                </h4>

                <div className="flex items-center gap-2">
                  {proj.live_link && (
                    <a
                      href={proj.live_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {proj.github_link && (
                    <a
                      href={proj.github_link}
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
                <p className="text-xs font-sans text-muted leading-relaxed line-clamp-2">
                  {proj.description}
                </p>
              )}

              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {proj.tech_stack.slice(0, 5).map((t, i) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
