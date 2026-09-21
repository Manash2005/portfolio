import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import data from '../data/portfolio_data.json'

const FEATURED = data.projects.filter(p => p.featured)

// Animated tech stack pill
function TechPill({ tech, delay }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.06em',
        color: 'var(--color-muted)',
        border: '1px solid var(--color-hairline)',
        borderRadius: '4px',
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {tech}
    </motion.span>
  )
}

// Link with draw-underline on hover
function DrawLink({ href, label, accent }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group/link relative"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: accent ? 'var(--color-accent)' : 'var(--color-muted)',
        letterSpacing: '0.04em',
        textDecoration: 'none',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => { if (!accent) e.currentTarget.style.color = 'var(--color-text)' }}
      onMouseLeave={e => { if (!accent) e.currentTarget.style.color = 'var(--color-muted)' }}
    >
      {label}
      <span
        style={{
          position: 'absolute',
          left: 0,
          bottom: -2,
          height: '1px',
          width: '100%',
          background: accent ? 'var(--color-accent)' : 'var(--color-text)',
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="group/link-hover:scale-x-100"
      />
    </a>
  )
}

function ProjectRow({ project, index }) {
  const imageRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['4%', '-4%'])
  const liveUrl = project.liveLink || project.githubLink

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="group grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center py-16"
      style={{ borderTop: '1px solid var(--color-hairline)', position: 'relative' }}
    >
      {/* Lime left-border accent — slides in on row hover */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: 'var(--color-accent)',
          borderRadius: 2,
          scaleY: 0,
          transformOrigin: 'top',
        }}
        whileHover={{ scaleY: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Text side */}
      <div className={index % 2 === 1 ? 'md:order-2' : ''} style={{ paddingLeft: '1rem' }}>
        {/* Large translucent number watermark */}
        <div style={{ position: 'relative', marginBottom: '-2.5rem' }}>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(5rem, 12vw, 9rem)',
              fontWeight: 800,
              color: 'var(--color-accent)',
              opacity: 0.04,
              lineHeight: 1,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </motion.p>
        </div>

        <p className="text-label mb-3" style={{ position: 'relative' }}>
          {String(index + 1).padStart(2, '0')} / {project.category}
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '0.85rem',
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

        {/* Tech stack pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techStack.map((tech, i) => (
            <TechPill key={tech} tech={tech} delay={0.05 * i} />
          ))}
        </div>

        {/* CTA links with draw-underline */}
        <div className="flex items-center gap-6">
          {project.liveLink && <DrawLink href={project.liveLink} label="Live ↗" accent />}
          {project.githubLink && <DrawLink href={project.githubLink} label="Code ↗" accent={false} />}
        </div>
      </div>

      {/* Image side — clickable, with hover overlay */}
      <div className={index % 2 === 1 ? 'md:order-1' : ''} ref={imageRef}>
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block',
            borderRadius: '1rem',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '16/9',
            background: 'var(--color-surface)',
            cursor: liveUrl ? 'pointer' : 'default',
          }}
          onClick={!liveUrl ? e => e.preventDefault() : undefined}
        >
          {project.image ? (
            <motion.img
              src={project.image}
              alt={`${project.title} screenshot`}
              width={800}
              height={450}
              loading="lazy"
              style={{ y: imageY }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ color: 'var(--color-muted)' }}
            >
              <span className="text-label">{project.title}</span>
            </div>
          )}

          {/* Hover overlay */}
          {liveUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(8,8,12,0.72)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  letterSpacing: '0.02em',
                }}
              >
                ↗ View live
              </span>
            </motion.div>
          )}
        </a>
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