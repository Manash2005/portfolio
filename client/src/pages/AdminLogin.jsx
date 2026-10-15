import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { isAdmin, login } = useAdmin()
  const navigate = useNavigate()
  const usernameRef = useRef(null)

  useEffect(() => {
    if (isAdmin) {
      navigate('/second-brain', { replace: true })
    } else if (usernameRef.current) {
      usernameRef.current.focus()
    }
  }, [isAdmin, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please provide both username and password.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await login(username.trim(), password)
      navigate('/second-brain', { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 py-20 relative overflow-hidden" style={{ background: '#08080C' }}>
      {/* Subtle ambient gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #B8FF3C 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-label mb-6 transition-colors hover:text-white"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
          >
            ← Return to Portfolio
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#B8FF3C' }} />
            <span
              className="text-label"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.08em' }}
            >
              PORTFOLIO MANAGEMENT
            </span>
          </div>
          <h1
            className="text-3xl font-normal tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Administrator Login
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            Enter your credentials to enable in-place editing, manage projects, and update calendar activities.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-start gap-3"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="text-red-400 font-bold">!</span>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl border" style={{
          background: 'rgba(15, 17, 24, 0.8)',
          borderColor: 'var(--color-hairline)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="mb-5">
            <label
              htmlFor="admin-username"
              className="block mb-2 text-xs font-mono"
              style={{ color: 'var(--color-muted)', letterSpacing: '0.05em' }}
            >
              USERNAME
            </label>
            <input
              id="admin-username"
              ref={usernameRef}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="e.g. manash"
              required
              className="w-full px-4 py-3 rounded-xl border bg-black/40 text-white placeholder-zinc-600 focus:outline-none focus:border-[#B8FF3C] transition-colors"
              style={{
                borderColor: 'var(--color-hairline)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="admin-password"
              className="block mb-2 text-xs font-mono"
              style={{ color: 'var(--color-muted)', letterSpacing: '0.05em' }}
            >
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border bg-black/40 text-white placeholder-zinc-600 focus:outline-none focus:border-[#B8FF3C] transition-colors pr-12"
                style={{
                  borderColor: 'var(--color-hairline)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: loading ? 'rgba(184, 255, 60, 0.4)' : '#B8FF3C',
              color: '#08080C',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>AUTHENTICATE & ENTER ADMIN MODE →</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          Shielded with military-grade scrypt hashing & sliding-window rate limiting.
        </p>
      </div>
    </main>
  )
}
