import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HelpCircle, AlertTriangle, ShieldCheck, Zap, Clock, EyeOff, Lightbulb, Award, X } from 'lucide-react'

export default function PenaltyRulesPopover({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        className="p-1 rounded-full text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer group flex items-center gap-1 focus:outline-none"
        aria-label="View DSA Arena Scoring and Penalty Rules"
        title="View Scoring & Penalty Rules"
      >
        <HelpCircle className="w-4 h-4 text-accent/80 group-hover:text-accent transition-colors" />
        <span className="text-[10px] font-mono text-muted/70 group-hover:text-muted hidden sm:inline">Rules</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-2xl border border-hairline bg-[#0E0E14]/98 backdrop-blur-2xl text-left z-50 shadow-2xl"
            style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(184,255,60,0.15)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                    Scoring & Penalty System
                  </h4>
                  <span className="text-[10px] text-muted">Fair, intelligent & performance-driven</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-white p-1 rounded-md hover:bg-white/5 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[340px] overflow-y-auto pr-1">
              {/* Overtime Penalty */}
              <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Target Overtime Penalties</span>
                </div>
                <p className="text-[10px] text-muted leading-relaxed">
                  Every minute spent past the target time deducts XP proportionally:
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="p-1.5 rounded bg-black/40 border border-white/5 text-center">
                    <span className="text-emerald-400 font-bold block">Easy (15m)</span>
                    <span className="text-rose-300">-10 XP / min</span>
                    <span className="text-[9px] text-muted block">(cap -40)</span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-white/5 text-center">
                    <span className="text-amber-400 font-bold block">Medium (30m)</span>
                    <span className="text-rose-300">-7 XP / min</span>
                    <span className="text-[9px] text-muted block">(cap -35)</span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-white/5 text-center">
                    <span className="text-rose-400 font-bold block">Hard (45m)</span>
                    <span className="text-rose-300">-5 XP / min</span>
                    <span className="text-[9px] text-muted block">(cap -30)</span>
                  </div>
                </div>
              </div>

              {/* Assistance & Hint Penalties */}
              <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Assistance & Editorial Penalties</span>
                </div>
                <ul className="space-y-1 text-[10px] text-muted">
                  <li className="flex items-start gap-1.5">
                    <EyeOff className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>Solution Viewed:</strong> Forfeits +30 Independent Bonus & marks -15 XP assistance penalty.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>Hints Accessed:</strong> -5 XP per hint used during active session.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <X className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                    <span><strong>Rapid Abandonment:</strong> 0 XP awarded if session is quit under 3 minutes.</span>
                  </li>
                </ul>
              </div>

              {/* Floor Protection & Base Rewards */}
              <div className="p-2.5 rounded-xl border border-accent/20 bg-accent/[0.04]">
                <div className="flex items-center gap-1.5 text-accent font-semibold mb-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Completion Floor & Rewards</span>
                </div>
                <div className="space-y-1 text-[10px] text-muted">
                  <p>
                    <strong className="text-white">Base Solve XP:</strong> Easy (+50), Medium (+65), Hard (+80).
                  </p>
                  <p>
                    <strong className="text-white">Bonuses:</strong> +30 Independent, +25 Spaced Revision, +20 Fast Execution, +15 Mistake Journaling.
                  </p>
                  <p className="text-emerald-300">
                    <strong className="text-white">Floor Protection:</strong> Finishing an attempt always guarantees minimum +15 XP (Easy), +20 XP (Medium), or +25 XP (Hard) so your perseverance is always recognized!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
