import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import data from '../data/portfolio_data.json'

export default function AllProjects() {
  return (
    <main className="content-layer px-6 md:px-12 pt-32 pb-24">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/"
          className="text-label mb-12 block transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
        >
          ← Back
        </Link>

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
          {data.projects.map((project, i) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              className="p-8 group"
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
              <p className="text-label mb-2">{project.category}</p>
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
                {project.outcome || project.short_description}
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
                {project.techStack.join(' · ')}
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
