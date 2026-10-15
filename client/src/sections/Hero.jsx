import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import data from '../data/portfolio_data.json'
import { useAdmin } from '../context/AdminContext'
import { API_BASE_URL } from '../utils/apiConfig'

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
  const { isAdmin, isEditMode, openEditAbout, contentVersion } = useAdmin()
  const [personal, setPersonal] = useState(data.personal)

  const apiUrl = API_BASE_URL

  useEffect(() => {
    fetch(`${apiUrl}/api/portfolio/content`)
      .then(res => res.json())
      .then(json => {
        if (json.data?.personal) {
          setPersonal(json.data.personal)
        }
      })
      .catch(() => {
        // fallback
      })
  }, [apiUrl, contentVersion])

  const headline = personal.headline || data.personal.headline
  const sub = personal.sub || data.personal.sub
  const name = personal.name || data.personal.name

  return (
    <section
      id="hero"
      className="content-layer min-h-screen flex flex-col justify-center px-6 md:px-12 section-padding relative"
      aria-label="Introduction"
    >
      <div className="max-w-5xl mx-auto w-full pt-20 md:pt-16">
        {/* Status pill & Admin Edit Hero Button */}
        <div className="flex items-center justify-between mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-accent)' }}
              aria-hidden
            />
            <span className="text-label">Open to work</span>
          </motion.div>

          {isAdmin && isEditMode && (
            <button
              onClick={openEditAbout}
              className="px-2.5 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer hover:bg-[#B8FF3C]/20"
              style={{
                background: 'rgba(184, 255, 60, 0.1)',
                borderColor: 'rgba(184, 255, 60, 0.4)',
                color: '#B8FF3C',
              }}
              title="Edit Hero Headline & Bio"
            >
              ✎ Edit Headline
            </button>
          )}
        </div>

        {/* Name */}
        <Reveal>
          <h1
            className="text-display mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            {name}
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
            {headline.includes('and AI agents') ? (
              headline.split('and AI agents').map((part, i) =>
                i === 0 ? (
                  <span key={i}>
                    {part}
                    <span style={{ color: 'var(--color-accent)' }}>and AI agents</span>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )
            ) : (
              <span>{headline}</span>
            )}
          </p>
        </Reveal>

        {/* Sub line */}
        <Reveal delay={0.14}>
          <p className="text-label mb-12">{sub}</p>
        </Reveal>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center gap-5"
        >
          <a
            href="#projects"
            className="btn-primary group"
            style={{ textDecoration: 'none' }}
          >
            <span>See my work</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
          </a>
          <a
            href="#contact"
            className="btn-ghost"
            style={{ textDecoration: 'none' }}
          >
            Get in touch
          </a>
        </motion.div>
      </div>
    </section>
  )
}
