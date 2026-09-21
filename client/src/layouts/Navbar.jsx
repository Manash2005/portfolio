import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Work',    id: 'projects' },
  { label: 'Proof',   id: 'activity' },
  { label: 'Build',   id: 'build' },
  { label: 'About',   id: 'about' },
  { label: 'Contact', id: 'contact' },
]

export default function Navbar() {
  const [visible, setVisible] = useState(true)
  const [activeId, setActiveId] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 8) return
      setVisible(y < 50 || y < lastY)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section via IntersectionObserver
  useEffect(() => {
    if (!isHome) return
    const ids = ['hero', 'projects', 'activity', 'build', 'about', 'contact']
    const observers = ids.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { threshold: 0.4 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [isHome, location])

  const scrollTo = (id) => {
    if (!isHome) {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          key="navbar"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="content-layer fixed top-4 left-1/2 -translate-x-1/2 z-50"
          role="banner"
        >
          <nav
            className="flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-xl border border-hairline"
            style={{
              background: 'rgba(14, 14, 20, 0.85)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
            }}
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link
              to="/"
              className="px-3 py-1.5 rounded-full text-sm font-display font-bold tracking-tight transition-colors"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}
              aria-label="Home"
            >
              MS<span style={{ color: 'var(--color-accent)' }}>.</span>
            </Link>

            <span style={{ width: 1, height: 16, background: 'var(--color-hairline)', margin: '0 4px' }} aria-hidden />

            {/* Nav items */}
            {NAV_ITEMS.map(item => {
              const isActive = activeId === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="relative px-3 py-1.5 rounded-full text-xs font-mono transition-colors"
                  style={{
                    color: isActive ? '#08080C' : 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'var(--color-accent)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              )
            })}

            <span style={{ width: 1, height: 16, background: 'var(--color-hairline)', margin: '0 4px' }} aria-hidden />

            {/* Resume CTA */}
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:block px-3 py-1.5 rounded-full text-xs font-mono transition-all"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)',
                border: '1px solid rgba(184,255,60,0.3)',
                letterSpacing: '0.06em',
              }}
            >
              Résumé ↗
            </a>
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  )
}