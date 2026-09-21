import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import data from '../data/portfolio_data.json'

const FEATURED = data.projects.filter(p => p.featured)

function ProjectRow({ project, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="group grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center py-16"
      style={{ borderTop: '1px solid var(--color-hairline)' }}
    >
      {/* Text side */}
      <div className={index % 2 === 1 ? 'md:order-2' : ''}>
        <p className="text-label mb-3">
          {String(index + 1).padStart(2, '0')} / {project.category}
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '1rem',
            lineHeight: 1.15,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-muted)',
            lineHeight: 1.7,
            marginBottom: '1.25rem',
            maxWidth: '42ch',
          }}
        >
          {project.outcome}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--color-muted)',
            letterSpacing: '0.08em',
            marginBottom: '2rem',
          }}
        >
          {project.techStack.join(' · ')}
        </p>

        <div className="flex items-center gap-4">
          {project.liveLink && (
            <a
              href={project.liveLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)',
                letterSpacing: '0.04em',
              }}
            >
              Live ↗
            </a>
          )}
          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-muted)',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
            >
              Code ↗
            </a>
          )}
        </div>
      </div>

      {/* Image side */}
      <div
        className={`overflow-hidden rounded-2xl aspect-video bg-surface ${index % 2 === 1 ? 'md:order-1' : ''}`}
        style={{ background: 'var(--color-surface)' }}
      >
        {project.image ? (
          <img
            src={project.image}
            alt={`${project.title} screenshot`}
            width={800}
            height={450}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: 'var(--color-muted)' }}
          >
            <span className="text-label">{project.title}</span>
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default function Projects() {
  return (
    <section
      id="projects"
      className="content-layer section-padding px-6 md:px-12"
      aria-label="Selected work"
    >
      <div className="max-w-5xl mx-auto">
        <div style={{ overflow: 'hidden' }}>
          <motion.p
            className="text-label mb-6"
            initial={{ y: '105%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            Selected work
          </motion.p>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <motion.h2
            className="text-heading mb-4"
            initial={{ y: '105%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            Things I've built.
          </motion.h2>
        </div>

        {/* Project rows */}
        {FEATURED.map((project, i) => (
          <ProjectRow key={project.title} project={project} index={i} />
        ))}

        {/* See all link */}
        <div className="pt-8" style={{ borderTop: '1px solid var(--color-hairline)' }}>
          <Link
            to="/projects"
            className="text-label transition-colors"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
          >
            See all projects →
          </Link>
        </div>
      </div>
    </section>
  )
}