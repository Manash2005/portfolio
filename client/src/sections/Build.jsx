import { motion } from 'motion/react'
import data from '../data/portfolio_data.json'
import { useEffect, useState } from 'react'
import { fetchWithRetry } from '../utils/fetchWithRetry'

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

const POLES = [
  { key: 'ai',   ...data.skills.ai },
  { key: 'web',  ...data.skills.web },
  { key: 'data', ...data.skills.data },
]

export default function Build() {
  const [stats, setStats] = useState({
    leetcode: data.stats.leetcode_fallback,
    gfg: data.stats.gfg_fallback,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://portfolio-c43c.onrender.com'
        const res = await fetchWithRetry(`${apiUrl}/api/v1/leetcode/stats/Manash_22`)
        const d = await res.json()
        if (d.success && d.stats) {
          const lc = d.stats.easy + d.stats.medium + d.stats.hard
          setStats(prev => ({ ...prev, leetcode: lc }))
        }
      } catch {
        // use fallback silently
      }
    }
    fetchStats()
  }, [])

  return (
    <section
      id="build"
      className="content-layer section-padding px-6 md:px-12"
      aria-label="Skills and expertise"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <Reveal>
          <p className="text-label mb-6">What I build</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2
            className="text-heading mb-16"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            Two poles. One builder.
          </h2>
        </Reveal>

        {/* Skill poles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {POLES.map((pole, i) => (
            <motion.div
              key={pole.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="py-8 md:py-10"
              style={{
                borderTop: '1px solid var(--color-hairline)',
                borderRight: i < 2 ? '1px solid var(--color-hairline)' : 'none',
                paddingLeft: i === 0 ? 0 : '2rem',
                paddingRight: i === 2 ? 0 : '2rem',
              }}
            >
              <p
                className="text-label mb-3"
                style={{ color: 'var(--color-accent)' }}
              >
                {pole.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '1.25rem',
                }}
              >
                {pole.tagline}
              </p>
              <ul className="space-y-1.5">
                {pole.items.map(item => (
                  <li
                    key={item}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Proof-of-work strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center gap-8 mt-12 pt-8"
          style={{ borderTop: '1px solid var(--color-hairline)' }}
        >
          {[
            { value: stats.leetcode, label: 'LeetCode solved' },
            { value: stats.gfg,      label: 'GFG solved' },
            { value: data.stats.projects, label: 'Projects shipped' },
          ].map(stat => (
            <div key={stat.label}>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p className="text-label mt-1">{stat.label}</p>
            </div>
          ))}
          <a
            href="https://github.com/Manash2005"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-label transition-colors"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
          >
            GitHub ↗
          </a>
        </motion.div>
      </div>
    </section>
  )
}
