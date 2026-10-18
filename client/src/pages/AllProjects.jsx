import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import data from '../data/portfolio_data.json'
import { useAdmin } from '../context/AdminContext'

export default function AllProjects() {
  const { isAdmin, isEditMode, openCreateProject, openEditProject, contentVersion, authFetch } = useAdmin()
  const [projects, setProjects] = useState(data.projects)

  useEffect(() => {
    const endpoint = isAdmin ? '/api/v1/admin/projects' : '/api/portfolio/projects'
    authFetch(endpoint)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setProjects(json.data)
        }
      })
      .catch(() => {
        // fallback to data.projects
      })
  }, [isAdmin, contentVersion, authFetch])

  return (
    <main className="content-layer px-6 md:px-12 pt-32 pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/"
            className="text-label block transition-colors"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
          >
            ← Back to Home
          </Link>

          {isAdmin && isEditMode && (
            <button
              onClick={openCreateProject}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer"
              style={{
                background: 'rgba(184, 255, 60, 0.12)',
                borderColor: 'rgba(184, 255, 60, 0.4)',
                color: '#B8FF3C',
              }}
            >
              <span>+</span>
              <span>Create Project</span>
            </button>
          )}
        </div>

        <div style={{ overflow: 'hidden' }}>
          <motion.h1
            className="text-display mb-16"
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            All projects
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px"
          style={{ border: '1px solid var(--color-hairline)', background: 'var(--color-hairline)' }}>
          {projects.map((project, i) => (
            <motion.article
              key={project.id || project.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              className="p-8 group relative"
              style={{ background: 'var(--color-bg)' }}
            >
              {project.image && (
                <div className="aspect-video rounded-xl overflow-hidden mb-6" style={{ background: 'var(--color-surface)' }}>
                  <img
                    src={project.image}
                    alt={`${project.title} screenshot`}
                    width={600}
                    height={340}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-label">{project.category}</p>
                  {project.is_published === false && (
                    <span
                      className="text-[0.65rem] px-2 py-0.5 rounded font-mono font-semibold"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                    >
                      DRAFT
                    </span>
                  )}
                </div>

                {isAdmin && isEditMode && (
                  <button
                    onClick={() => openEditProject(project)}
                    className="px-2.5 py-0.5 rounded text-[0.68rem] font-mono border transition-all cursor-pointer"
                    style={{
                      background: 'rgba(184, 255, 60, 0.1)',
                      borderColor: 'rgba(184, 255, 60, 0.4)',
                      color: '#B8FF3C',
                    }}
                    title="Edit project"
                  >
                    ✎ Edit
                  </button>
                )}
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginBottom: '0.75rem',
                }}
              >
                {project.title}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--color-muted)',
                  lineHeight: 1.7,
                  marginBottom: '1.25rem',
                }}
              >
                {project.outcome || project.short_description || project.description}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: 'var(--color-muted)',
                  letterSpacing: '0.06em',
                  marginBottom: '1.5rem',
                }}
              >
                {Array.isArray(project.techStack)
                  ? project.techStack.join(' · ')
                  : Array.isArray(project.tech_stack)
                  ? project.tech_stack.join(' · ')
                  : typeof (project.techStack || project.tech_stack) === 'string'
                  ? (project.techStack || project.tech_stack)
                  : ''}
              </p>
              <div className="flex gap-5">
                {project.liveLink && (
                  <a href={project.liveLink} target="_blank" rel="noreferrer"
                    className="text-label transition-colors"
                    style={{ color: 'var(--color-accent)' }}>
                    Live ↗
                  </a>
                )}
                {project.githubLink && (
                  <a href={project.githubLink} target="_blank" rel="noreferrer"
                    className="text-label transition-colors"
                    style={{ color: 'var(--color-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                    Code ↗
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  )
}
