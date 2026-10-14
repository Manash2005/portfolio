import { Target, FolderGit2, CheckCircle2, Clock, ExternalLink } from 'lucide-react'

export default function GoalsAndProjectsPanel({ goals = [], projects = [] }) {
  if (goals.length === 0 && projects.length === 0) return null

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
      {/* 1. Goals Column */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <span>Active Strategic Goals</span>
          </h3>
          <span className="text-xs font-mono text-muted/60">{goals.length} goals</span>
        </div>

        <div className="flex flex-col gap-3">
          {goals.map((goal) => {
            const isCompleted = goal.status === 'completed'
            const percent = goal.total_events > 0
              ? Math.round((goal.completed_events / goal.total_events) * 100)
              : 0

            return (
              <div
                key={goal.id}
                className="p-4 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-white/15 transition-all shadow-md flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
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
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Projects Column */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-accent" />
            <span>Connected Projects</span>
          </h3>
          <span className="text-xs font-mono text-muted/60">{projects.length} projects</span>
        </div>

        <div className="flex flex-col gap-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-white/15 transition-all shadow-md flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-accent font-semibold">
                  {proj.category}
                </span>
                {proj.goal_title && (
                  <span className="text-[10px] font-mono text-muted truncate max-w-[200px]">
                    Goal: {proj.goal_title}
                  </span>
                )}
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
