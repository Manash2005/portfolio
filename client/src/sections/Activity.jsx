import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useActivityData } from '../hooks/useActivityData'
import { computeInsights, getMonthBoundaries } from '../utils/activityStats'
import SourceTabs from '../components/activity/SourceTabs'
import InsightsRow from '../components/activity/InsightsRow'
import FlatGrid from '../components/activity/FlatGrid'
import SkylineCanvas from '../components/activity/SkylineCanvas'

const LEVEL_COLORS = [
  'rgba(255, 255, 255, 0.05)',
  'rgba(184, 255, 60, 0.28)',
  'rgba(184, 255, 60, 0.52)',
  'rgba(184, 255, 60, 0.78)',
  '#B8FF3C',
]

export default function Activity() {
  const {
    days,
    status,
    isSlow,
    isCached,
    relativeUpdated,
    errorMessage,
    leetcodeSummary,
    gfgSummary,
    retry,
  } = useActivityData()

  const [activeSource, setActiveSource] = useState('all') // 'all' | 'github' | 'leetcode' | 'gfg'
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'skyline'
    const isMobile = window.innerWidth < 768
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return isMobile || prefersReduced ? 'flat' : 'skyline'
  })
  const [focusedMonth, setFocusedMonth] = useState(null)
  const [isReplaying, setIsReplaying] = useState(false)

  const sectionRef = useRef(null)
  const [isNearViewport, setIsNearViewport] = useState(false)

  // Mount 3D skyline canvas only when near viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting)
      },
      { rootMargin: '300px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keyboard escape listener to reset month focus
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && focusedMonth !== null) {
        setFocusedMonth(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusedMonth])

  // Compute insights based on selected source
  const insights = useMemo(() => {
    if (!days || days.length === 0) return null
    return computeInsights(days, activeSource)
  }, [days, activeSource])

  // Compute month boundaries for month focus pills
  const months = useMemo(() => {
    if (!days || days.length === 0) return []
    return getMonthBoundaries(days, activeSource)
  }, [days, activeSource])

  // Total GitHub count for SourceTabs
  const githubTotal = useMemo(() => {
    if (!days || days.length === 0) return 0
    return days.reduce((sum, d) => sum + (d.github || 0), 0)
  }, [days])

  // Handle Replay trigger
  const handleReplay = () => {
    if (isReplaying) return
    setIsReplaying(true)
    setTimeout(() => {
      setIsReplaying(false)
    }, 3100)
  }

  // Focused month info
  const focusedMonthData = useMemo(() => {
    if (focusedMonth === null) return null
    return months.find((m) => m.monthIndex === focusedMonth)
  }, [months, focusedMonth])

  return (
    <section
      ref={sectionRef}
      id="activity"
      className="content-layer section-padding px-6 md:px-12"
      aria-label="Proof of work activity section"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-label mb-3">Proof of work</p>
            <h2
              className="text-heading tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
            >
              Proof of work.
            </h2>
            <p
              className="text-sm font-mono mt-2"
              style={{ color: 'var(--color-muted)', letterSpacing: '0.01em' }}
            >
              Every square is a day I showed up.
            </p>
          </div>

          {/* Controls: Skyline / Flat view toggle & Replay */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-full border border-hairline bg-[#0E0E14]/80">
              <button
                onClick={() => setViewMode('skyline')}
                className="px-3 py-1 rounded-full text-xs font-mono transition-colors focus-visible:outline-none"
                style={{
                  background: viewMode === 'skyline' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: viewMode === 'skyline' ? 'var(--color-text)' : 'var(--color-muted)',
                }}
              >
                Skyline
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className="px-3 py-1 rounded-full text-xs font-mono transition-colors focus-visible:outline-none"
                style={{
                  background: viewMode === 'flat' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: viewMode === 'flat' ? 'var(--color-text)' : 'var(--color-muted)',
                }}
              >
                Flat
              </button>
            </div>

            {/* Replay Button */}
            <button
              onClick={handleReplay}
              disabled={isReplaying || status !== 'ready'}
              className="px-3.5 py-1.5 rounded-full text-xs font-mono border border-hairline transition-all hover:border-accent hover:text-accent disabled:opacity-40"
              style={{
                color: isReplaying ? 'var(--color-accent)' : 'var(--color-muted)',
                background: '#0E0E14',
              }}
              title="Replay activity chronology"
            >
              {isReplaying ? 'Replaying…' : 'Replay ↻'}
            </button>
          </div>
        </div>

        {/* Source Switcher */}
        <div className="mb-6">
          <SourceTabs
            activeTab={activeSource}
            onTabChange={(tab) => {
              setActiveSource(tab)
              setFocusedMonth(null)
            }}
            leetcodeSummary={leetcodeSummary}
            gfgSummary={gfgSummary}
            githubTotal={githubTotal}
          />
        </div>

        {/* Loading / Error States */}
        {status === 'loading' && (
          <div className="w-full py-20 px-8 rounded-2xl border border-hairline bg-[#0E0E14]/40 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-muted">
              {isSlow ? 'waking up the server… (Render spin-up)' : 'aggregating activity stream…'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="w-full py-16 px-8 rounded-2xl border border-hairline bg-[#160E0E]/40 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm font-mono text-red-400">
              {errorMessage || 'Service temporarily unreachable.'}
            </p>
            <button
              onClick={retry}
              className="px-4 py-2 rounded-full text-xs font-mono bg-accent text-bg font-medium hover:opacity-90"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Ready State Canvas or Flat Grid */}
        {status === 'ready' && (
          <div className="flex flex-col gap-6">
            {/* Active view */}
            <div className="relative">
              {viewMode === 'skyline' && isNearViewport ? (
                <SkylineCanvas
                  days={days}
                  sourceKey={activeSource}
                  focusedMonth={focusedMonth}
                  isReplaying={isReplaying}
                  onResetMonthFocus={() => setFocusedMonth(null)}
                />
              ) : (
                <FlatGrid
                  days={days}
                  sourceKey={activeSource}
                  focusedMonth={focusedMonth}
                  onMonthFocus={(mIdx) => setFocusedMonth(mIdx)}
                  onResetMonthFocus={() => setFocusedMonth(null)}
                />
              )}

              {/* Month Focus Indicator Chip */}
              <AnimatePresence>
                {focusedMonthData && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-4 right-4 z-20 flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-accent bg-[#08080C]/90 backdrop-blur-md text-xs font-mono"
                  >
                    <span>
                      <strong style={{ color: 'var(--color-accent)' }}>{focusedMonthData.name}:</strong>{' '}
                      {focusedMonthData.total} {activeSource} contributions
                    </span>
                    <button
                      onClick={() => setFocusedMonth(null)}
                      className="text-muted hover:text-white transition-colors cursor-pointer text-sm"
                      title="Clear focus (Esc)"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Front Edge Month Focus Buttons (for Skyline mode) */}
            {viewMode === 'skyline' && (
              <div className="flex items-center justify-between overflow-x-auto pb-1 gap-1 text-[11px] font-mono border-t border-hairline pt-3">
                <span className="text-[10px] text-muted uppercase tracking-wider pr-2 select-none">
                  Month:
                </span>
                {months.map((m) => {
                  const isSel = focusedMonth === m.monthIndex
                  return (
                    <button
                      key={m.name + m.weekIndex}
                      onClick={() => {
                        if (isSel) setFocusedMonth(null)
                        else setFocusedMonth(m.monthIndex)
                      }}
                      className="px-2 py-0.5 rounded transition-all cursor-pointer hover:text-white"
                      style={{
                        color: isSel ? 'var(--color-accent)' : 'var(--color-muted)',
                        background: isSel ? 'rgba(184, 255, 60, 0.12)' : 'transparent',
                        fontWeight: isSel ? '600' : 'normal',
                      }}
                    >
                      {m.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Insights Row */}
            <InsightsRow
              insights={insights}
              sourceLabel={activeSource === 'all' ? 'total' : activeSource}
            />

            {/* Legend & Cache/Relative Time Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-muted">
              {/* Legend: Less [swatches] More */}
              <div className="flex items-center gap-2" aria-label="Activity intensity scale">
                <span className="text-[11px]">Less</span>
                <div className="flex items-center gap-1">
                  {LEVEL_COLORS.map((col, idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rounded-[2px]"
                      style={{
                        backgroundColor: col,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px]">More</span>
              </div>

              {/* Status info */}
              <div className="flex items-center gap-3 text-[11px]">
                {isCached && <span className="opacity-70">(cached locally)</span>}
                {relativeUpdated && <span>updated {relativeUpdated}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
