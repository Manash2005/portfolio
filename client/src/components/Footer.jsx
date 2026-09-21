export default function Footer() {
  return (
    <footer className="content-layer border-t border-hairline py-8 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-label" style={{ color: 'var(--color-muted)' }}>
          Manash Swain · {new Date().getFullYear()} · Designed & built by me
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-label hover:text-accent transition-colors"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Back to top"
        >
          ↑ Back to top
        </button>
      </div>
    </footer>
  )
}
