import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import data from '../data/portfolio_data.json'

function PhotoCard({ linkedinUrl }) {
  const [hovered, setHovered] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-50, 50], [6, -6])
  const rotateY = useTransform(x, [-50, 50], [-6, 6])

  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleLeave = () => { x.set(0); y.set(0); setHovered(false) }

  return (
    <a
      href={linkedinUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="View Manash Swain on LinkedIn"
      style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        onMouseEnter={() => setHovered(true)}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 600,
          position: 'relative',
          borderRadius: '1rem',
          overflow: 'hidden',
          aspectRatio: '3/4',
          cursor: 'pointer',
        }}
      >
        <img
          src="/about_me_photo.png"
          alt="Manash Swain"
          width={320}
          height={427}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{
            filter: 'grayscale(20%) contrast(1.05)',
            transition: 'filter 0.3s',
            ...(hovered ? { filter: 'grayscale(0%) contrast(1.1) brightness(0.7)' } : {}),
          }}
        />

        {/* LinkedIn hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            pointerEvents: 'none',
          }}
        >
          {/* LinkedIn icon */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#0A66C2" />
            <path d="M7 9h2v8H7V9zm1-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM11 9h1.9v1.1c.3-.6 1-1.2 2.1-1.2 2.2 0 2.6 1.4 2.6 3.3V17h-2v-4.4c0-.8 0-1.9-1.2-1.9-1.2 0-1.4.9-1.4 1.8V17H11V9z" fill="white" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.02em',
            }}
          >
            View on LinkedIn
          </span>
        </motion.div>
      </motion.div>
    </a>
  )
}

function Reveal({ children, delay = 0 }) {
  return (
    <div style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '105%', opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function About() {
  const { about, now } = data.personal

  return (
    <section
      id="about"
      className="content-layer section-padding px-6 md:px-12"
      aria-label="About Manash Swain"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* Text */}
        <div>
          <Reveal>
            <p className="text-label mb-6">About</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              className="text-heading mb-10"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
            >
              Builder. Thinker.<br />
              <span style={{ color: 'var(--color-accent)' }}>AI-obsessed.</span>
            </h2>
          </Reveal>

          <div className="space-y-5 mb-12">
            {about.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  lineHeight: 1.75,
                  color: 'var(--color-muted)',
                }}
              >
                {para}
              </motion.p>
            ))}
          </div>

          {/* Now block */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-5 rounded-xl"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-hairline)',
            }}
          >
            <p className="text-label mb-4">Now</p>
            {Object.entries(now).map(([key, val]) => (
              <div
                key={key}
                className="flex gap-3 py-2"
                style={{ borderBottom: '1px solid var(--color-hairline)' }}
              >
                <span
                  className="text-label"
                  style={{ color: 'var(--color-accent)', minWidth: '5rem', textTransform: 'capitalize' }}
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <PhotoCard linkedinUrl={data.contact.linkedin} />
        </motion.div>
      </div>
    </section>
  )
}