import { motion } from 'motion/react'
import data from '../data/portfolio_data.json'
import { useEffect, useState } from 'react'
import { fetchWithRetry } from '../utils/fetchWithRetry'
import { API_BASE_URL } from '../utils/apiConfig'

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
        const apiUrl = API_BASE_URL
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POLES.map((pole, i) => (
            <motion.div
              key={pole.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 md:p-7 rounded-3xl border border-hairline bg-[#0E0E16]/80 hover:border-accent/40 hover:bg-[#12121C] transition-all duration-300 flex flex-col justify-between shadow-xl relative group overflow-hidden"
            >
              {/* Subtle top edge glow on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%)',
                }}
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-[0.72rem] font-mono font-bold uppercase tracking-wider"
                    style={{
                      background: 'rgba(184, 255, 60, 0.12)',
                      color: 'var(--color-accent)',
                      border: '1px solid rgba(184, 255, 60, 0.3)',
                    }}
                  >
                    {pole.label}
                  </span>
                  <span className="text-xs font-mono text-muted/60 font-semibold">
                    0{i + 1}
                  </span>
                </div>

                <p
                  className="text-white group-hover:text-accent transition-colors"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    marginBottom: '1.25rem',
                  }}
                >
                  {pole.tagline}
                </p>

                {/* Skill Pills */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {pole.items.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono border border-white/5 bg-white/[0.03] text-gray-300 group-hover:border-white/10 group-hover:bg-white/[0.05] transition-all hover:text-white hover:border-accent/50"
                      style={{
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[0.7rem] font-mono text-muted">
                <span>Verified Core Competency</span>
                <span className="text-accent font-semibold">Ready</span>
              </div>
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
