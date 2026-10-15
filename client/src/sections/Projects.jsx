import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import data from '../data/portfolio_data.json'
import { useAdmin } from '../context/AdminContext'

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
  const { isAdmin, isEditMode, openEditProject } = useAdmin()
  const imageRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['3%', '-3%'])
  const liveUrl = project.liveLink || project.githubLink
  const techList = Array.isArray(project.techStack) ? project.techStack : []

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="group relative rounded-3xl border border-hairline bg-[#0B0B11]/80 hover:border-white/20 transition-all duration-300 p-6 md:p-8 mb-8 backdrop-blur-sm overflow-hidden"
    >
      {/* Subtle top lime edge highlight on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%)',
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Structured Project Details */}
        <div className={`lg:col-span-7 flex flex-col justify-between gap-4 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
          {/* Header Row: Index, Category & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-2.5 py-1 rounded-md text-[0.7rem] font-mono font-bold"
                style={{
                  background: 'rgba(184, 255, 60, 0.1)',
                  color: 'var(--color-accent)',
                  border: '1px solid rgba(184, 255, 60, 0.25)',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-label" style={{ letterSpacing: '0.08em' }}>
                {project.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {project.is_published === false && (
                <span className="text-[0.65rem] px-2 py-0.5 rounded font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  DRAFT
                </span>
              )}

              {isAdmin && isEditMode && (
                <button
                  onClick={() => openEditProject(project)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-[#B8FF3C]/40 bg-[#B8FF3C]/10 text-[#B8FF3C] hover:bg-[#B8FF3C]/20 transition-all cursor-pointer"
                  title="Edit project details"
                >
                  ✎ Edit
                </button>
              )}
            </div>
          </div>

          {/* Project Title */}
          <h3
            className="text-white group-hover:text-[#B8FF3C] transition-colors"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {project.title}
          </h3>

          {/* Outcome / Description badge card */}
          {project.outcome && (
            <div
              className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]"
              style={{ borderLeft: '3px solid var(--color-accent)' }}
            >
              <span className="text-[0.68rem] font-mono text-accent uppercase font-bold tracking-wider block mb-1">
                Impact & Outcome
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  lineHeight: 1.6,
                }}
              >
                {project.outcome}
              </p>
            </div>
          )}

          {/* Short description / problem */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--color-muted)',
              lineHeight: 1.65,
            }}
          >
            {project.short_description || project.problem || project.description}
          </p>

          {/* Tech Stack Chips */}
          {techList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {techList.map((tech, i) => (
                <TechPill key={tech} tech={tech} delay={0.03 * i} />
              ))}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-5 pt-3 border-t border-white/5">
            {project.liveLink && (
              <a
                href={project.liveLink}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  padding: '0.6rem 1.35rem',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                }}
              >
                <span>Live Demo</span>
                <span>↗</span>
              </a>
            )}
            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
                style={{
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                }}
              >
                <span>View Source</span>
                <span>↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Screenshot / Preview Graphic */}
        <div className={`lg:col-span-5 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`} ref={imageRef}>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl overflow-hidden relative border border-white/10 group/img bg-[#12121A] transition-all hover:border-accent/40"
            style={{
              aspectRatio: '16/10',
              cursor: liveUrl ? 'pointer' : 'default',
            }}
            onClick={!liveUrl ? (e) => e.preventDefault() : undefined}
          >
            {project.image ? (
              <motion.img
                src={project.image}
                alt={`${project.title} screenshot`}
                width={800}
                height={500}
                loading="lazy"
                style={{ y: imageY }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center bg-gradient-to-br from-[#12121A] to-[#0A0A10]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent font-mono text-sm font-bold">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <span className="text-white font-display font-semibold text-base mt-2">
                  {project.title}
                </span>
                <span className="text-xs font-mono text-muted">
                  Interactive Live Architecture
                </span>
              </div>
            )}

            {/* Hover overlay button */}
            {liveUrl && (
              <div className="absolute inset-0 bg-[#08080C]/75 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-250 flex items-center justify-center">
                <span className="px-4 py-2 rounded-full bg-accent text-[#08080C] font-mono text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover/img:translate-y-0 transition-transform duration-250">
                  <span>Explore Project</span>
                  <span>↗</span>
                </span>
              </div>
            )}
          </a>
        </div>
      </div>
    </motion.article>
  )
}

export default function Projects() {
  const { isAdmin, isEditMode, openCreateProject, contentVersion, authFetch } = useAdmin()
  const [projects, setProjects] = useState(() => data.projects.filter(p => p.featured))

  useEffect(() => {
    const endpoint = isAdmin ? '/api/v1/admin/projects' : '/api/portfolio/projects'
    authFetch(endpoint)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          // If admin, show all featured or all projects; if visitor, only published featured
          const featured = isAdmin
            ? json.data.filter(p => p.featured || !p.is_published)
            : json.data.filter(p => p.featured)
          setProjects(featured.length > 0 ? featured : json.data)
        }
      })
      .catch(() => {
        // graceful fallback to data.projects
      })
  }, [isAdmin, contentVersion, authFetch])

  return (
    <section
      id="projects"
      className="content-layer section-padding px-6 md:px-12"
      aria-label="Selected work"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div style={{ overflow: 'hidden' }}>
            <motion.p
              className="text-label"
              initial={{ y: '105%', opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              Selected work
            </motion.p>
          </div>

          {isAdmin && isEditMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={openCreateProject}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer"
              style={{
                background: 'rgba(184, 255, 60, 0.12)',
                borderColor: 'rgba(184, 255, 60, 0.4)',
                color: '#B8FF3C',
              }}
              title="Add a new project"
            >
              <span>+</span>
              <span>New Project</span>
            </motion.button>
          )}
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
        {projects.map((project, i) => (
          <ProjectRow key={project.id || project.title} project={project} index={i} />
        ))}

        {/* See all link */}
        <div className="pt-8 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-hairline)' }}>
          <Link
            to="/projects"
            className="text-label transition-colors"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
          >
            See all projects →
          </Link>

          {isAdmin && isEditMode && (
            <button
              onClick={openCreateProject}
              className="text-label text-[#B8FF3C] hover:underline cursor-pointer"
            >
              + Create Another Project
            </button>
          )}
        </div>
      </div>
    </section>
  )
}