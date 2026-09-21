import { motion } from 'motion/react'
import data from '../data/portfolio_data.json'

// Subtle text reveal — mask translate up
function Reveal({ children, delay = 0, className = '' }) {
  return (
    <div style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '105%', opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="content-layer min-h-screen flex flex-col justify-center px-6 md:px-12 section-padding"
      aria-label="Introduction"
    >
      <div className="max-w-5xl mx-auto w-full pt-20 md:pt-16">
        {/* Status pill — static, no animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-10"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-accent)' }}
            aria-hidden
          />
          <span className="text-label">Open to internships</span>
        </motion.div>

        {/* Name */}
        <Reveal>
          <h1
            className="text-display mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            {data.personal.name}
          </h1>
        </Reveal>

        {/* Headline */}
        <Reveal delay={0.08}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.25rem, 3vw, 2rem)',
              fontWeight: 500,
              lineHeight: 1.3,
              color: 'var(--color-muted)',
              maxWidth: '38ch',
              marginBottom: '2.5rem',
            }}
          >
            {data.personal.headline.split('and AI agents').map((part, i) =>
              i === 0 ? (
                <span key={i}>
                  {part}
                  <span style={{ color: 'var(--color-accent)' }}>and AI agents</span>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        </Reveal>

        {/* Sub line */}
        <Reveal delay={0.14}>
          <p className="text-label mb-12">{data.personal.sub}</p>
        </Reveal>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center gap-4"
        >
          <a
            href="#projects"
            onClick={e => {
              e.preventDefault()
              document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-6 py-3 rounded-full text-sm font-mono transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-accent)',
              color: '#08080C',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            View work ↓
          </a>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full text-sm font-mono transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-muted)',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.color = 'var(--color-muted)' }}
          >
            Résumé ↗
          </a>
        </motion.div>
      </div>
    </section>
  )
}
