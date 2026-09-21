import { motion, useMotionValue, useTransform } from 'motion/react'
import data from '../data/portfolio_data.json'

function PhotoCard() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-50, 50], [6, -6])
  const rotateY = useTransform(x, [-50, 50], [-6, 6])

  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 600,
      }}
      className="w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden mx-auto"
    >
      <img
        src="/about_me_photo.png"
        alt="Manash Swain"
        width={320}
        height={427}
        loading="lazy"
        className="w-full h-full object-cover"
        style={{ filter: 'grayscale(20%) contrast(1.05)' }}
      />
    </motion.div>
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
          <PhotoCard />
        </motion.div>
      </div>
    </section>
  )
}