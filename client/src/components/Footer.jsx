import { Link } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function Footer() {
  const { isAdmin } = useAdmin()

  return (
    <footer className="content-layer border-t border-hairline py-8 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-label" style={{ color: 'var(--color-muted)' }}>
          Manash Swain · {new Date().getFullYear()} · Designed & built by me
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-label hover:text-accent transition-colors cursor-pointer"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Back to top"
        >
          ↑ Back to top
        </button>
      </div>

      <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-hairline/40 flex justify-center">
        {isAdmin ? (
          <span
            className="text-label flex items-center gap-2"
            style={{ color: '#B8FF3C', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C] animate-pulse" />
            Admin Mode Active · Full In-Place Control Enabled
          </span>
        ) : (
          <Link
            to="/admin/login"
            className="text-label transition-colors hover:text-[#B8FF3C]"
            style={{
              color: 'var(--color-muted)',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              opacity: 0.65,
              textDecoration: 'none',
            }}
          >
            If you're Manash, log in →
          </Link>
        )}
      </div>
    </footer>
  )
}
