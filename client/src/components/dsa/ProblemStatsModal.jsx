import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  ExternalLink,
  Award,
  Zap,
  Clock,
  RotateCcw,
  Star,
  CheckCircle2,
  AlertTriangle,
  Play,
  Calendar,
  Layers,
  BookOpen,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { API_BASE_URL } from '../../utils/apiConfig'
import { useAdmin } from '../../context/AdminContext'

function formatDuration(totalSec) {
  if (totalSec == null) return 'N/A'
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs > 0 ? `${secs}s` : ''}`
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'Never'
  const parsed = dateString.includes('T')
    ? (dateString.endsWith('Z') || dateString.includes('+') ? dateString : `${dateString}Z`)
    : `${dateString.replace(' ', 'T')}Z`
  const date = new Date(parsed)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (isNaN(diffSec) || diffSec < 0) return 'Just now'
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getRevisionCountdown(dueString) {
  if (!dueString) return null
  const today = new Date().toISOString().split('T')[0]
  if (dueString < today) {
    const diffDays = Math.round((new Date(today) - new Date(dueString)) / (1000 * 60 * 60 * 24))
    return { text: `Overdue by ${diffDays} day${diffDays === 1 ? '' : 's'}`, urgency: 'overdue' }
  } else if (dueString === today) {
    return { text: 'Due today', urgency: 'today' }
  } else {
    const diffDays = Math.round((new Date(dueString) - new Date(today)) / (1000 * 60 * 60 * 24))
    return {
      text: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`,
      urgency: 'upcoming',
    }
  }
}

export default function ProblemStatsModal({
  problemId,
  initialProblem = null,
  onClose,
  onLaunchPractice,
}) {
  const { isAdmin, authFetch } = useAdmin()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [problemData, setProblemData] = useState(initialProblem)

  useEffect(() => {
    let isMounted = true
    const fetchDetails = async () => {
      if (!problemId) return
      setLoading(true)
      setError(null)
      try {
        const endpoint = `${API_BASE_URL}/api/v1/dsa/problems/${problemId}`
        const res = await (isAdmin ? authFetch(endpoint) : fetch(endpoint))
        if (!res.ok) {
          throw new Error('Failed to load problem statistics')
        }
        const json = await res.json()
        if (json.success && isMounted) {
          setProblemData(json.problem)
        }
      } catch (err) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDetails()
    return () => {
      isMounted = false
    }
  }, [problemId, isAdmin, authFetch])

  if (!problemId) return null

  const p = problemData || initialProblem || {}
  const attempts = p.attempts || []
  const mistakes = p.mistakes || []
  const rev = p.revision_schedule || null
  const mastery = p.mastery || {
    score: 0,
    level: 'Novice',
    explanation: 'No attempt records found for this question.',
  }

  const solvedAttempts = attempts.filter((a) => a.result === 'solved')
  const totalAttempts = attempts.length
  const totalSolves = solvedAttempts.length
  const independentSolves = solvedAttempts.filter((a) => a.is_independent === 1).length
  const bestDuration = p.best_duration_seconds != null
    ? p.best_duration_seconds
    : solvedAttempts.length > 0
    ? Math.min(...solvedAttempts.map((a) => a.duration_seconds || Infinity))
    : null

  const latestAttempt = attempts[0]
  const countdown = rev ? getRevisionCountdown(rev.next_revision_due) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl rounded-3xl border border-hairline bg-[#0E0E14] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-left my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-hairline">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  p.difficulty === 'Easy'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : p.difficulty === 'Medium'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {p.difficulty || 'Medium'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-hairline uppercase">
                {p.platform || 'leetcode'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                {p.primary_topic || 'DSA'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                {p.title || 'Problem Statistics'}
              </h2>
              {p.canonical_url && (
                <a
                  href={p.canonical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                  title="Open canonical problem page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-muted">Loading question performance stats...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            {error}
          </div>
        ) : (
          <>
            {/* KPI Row: Mastery, Solves, Duration, Confidence */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Mastery */}
              <div className="p-4 rounded-2xl border border-hairline bg-[#12121A] flex flex-col justify-between gap-2">
                <span className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-accent" />
                  <span>Mastery Tier</span>
                </span>
                <div>
                  <span className="text-lg font-display font-bold text-white block">
                    {mastery.level}
                  </span>
                  <span className="text-[10px] font-mono text-accent">
                    {mastery.score}% Score
                  </span>
                </div>
              </div>

              {/* Total Solves */}
              <div className="p-4 rounded-2xl border border-hairline bg-[#12121A] flex flex-col justify-between gap-2">
                <span className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Solves</span>
                </span>
                <div>
                  <span className="text-lg font-display font-bold text-white block">
                    {totalSolves}{' '}
                    <span className="text-xs text-muted font-normal">/ {totalAttempts} att.</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    {independentSolves} Independent
                  </span>
                </div>
              </div>

              {/* Best Speed */}
              <div className="p-4 rounded-2xl border border-hairline bg-[#12121A] flex flex-col justify-between gap-2">
                <span className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Best Duration</span>
                </span>
                <div>
                  <span className="text-lg font-display font-bold text-white block">
                    {formatDuration(bestDuration)}
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    Target: ~{p.estimated_solve_time || 20}m
                  </span>
                </div>
              </div>

              {/* Confidence */}
              <div className="p-4 rounded-2xl border border-hairline bg-[#12121A] flex flex-col justify-between gap-2">
                <span className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confidence</span>
                </span>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (latestAttempt?.confidence_rating || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-muted block mt-1">
                    {latestAttempt ? `Last: ${latestAttempt.confidence_rating}/5` : 'No solves yet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Spaced Repetition Schedule Details Card */}
            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-display font-bold text-white">
                    Spaced Repetition Schedule
                  </h4>
                </div>
                {countdown && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      countdown.urgency === 'overdue'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : countdown.urgency === 'today'
                        ? 'bg-amber-400 text-[#08080C]'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {countdown.text}
                  </span>
                )}
              </div>

              {rev ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                  <div>
                    <span className="text-[10px] text-muted block">Next Scheduled Date</span>
                    <span className="text-white font-medium">{rev.next_revision_due}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Interval Window</span>
                    <span className="text-white font-medium">{rev.interval_days} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Repetition Cycle</span>
                    <span className="text-white font-medium">Stage #{rev.repetition_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Retention Factor</span>
                    <span className="text-white font-medium">{rev.ease_factor || 2.5}x</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-muted">
                  This problem is not currently in your spaced repetition rotation. Solving it in the Practice Arena will automatically schedule it for memory retention!
                </p>
              )}
            </div>

            {/* Attempt History Timeline */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>Solve History & Attempt Logs</span>
                </h4>
                <span className="text-xs font-mono text-muted">
                  {attempts.length} logged attempt{attempts.length === 1 ? '' : 's'}
                </span>
              </div>

              {attempts.length === 0 ? (
                <div className="p-6 rounded-2xl border border-hairline bg-[#12121A] text-center text-xs font-mono text-muted">
                  No attempts recorded yet for this question.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {attempts.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="p-3.5 rounded-xl border border-white/5 bg-[#12121A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.result === 'solved'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {att.result === 'solved' ? 'SOLVED' : 'UNSOLVED'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              att.is_independent === 1
                                ? 'bg-white/5 text-emerald-300'
                                : 'bg-white/5 text-amber-300'
                            }`}
                          >
                            {att.is_independent === 1 ? 'Independent' : 'Assisted'}
                          </span>
                          <span className="text-white font-medium">
                            {formatDuration(att.duration_seconds)}
                          </span>
                          {att.xp_awarded > 0 && (
                            <span className="text-accent font-bold">
                              +{att.xp_awarded} XP
                            </span>
                          )}
                        </div>

                        {att.notes && (
                          <p className="text-[11px] text-[#B0B0C0] italic mt-0.5 pl-1 border-l-2 border-accent/40">
                            "{att.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-muted text-[11px] shrink-0">
                        <span>{att.language || 'Java'}</span>
                        <span>{formatRelativeTime(att.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mistake Reflections (if any) */}
            {mistakes.length > 0 && (
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                    Mistake Journal Reflections
                  </h4>
                </div>
                <div className="flex flex-col gap-2">
                  {mistakes.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono"
                    >
                      <span className="text-[10px] text-rose-400 uppercase font-bold block mb-0.5">
                        {m.category?.replace('_', ' ')}
                      </span>
                      <p className="text-white mb-1">{m.mistake_description}</p>
                      {m.lesson_learned && (
                        <p className="text-[11px] text-emerald-300">
                          <span className="text-muted">Takeaway:</span> {m.lesson_learned}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono text-muted hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              {onLaunchPractice && (
                <button
                  onClick={() => {
                    onClose()
                    onLaunchPractice(p)
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Practice in Arena</span>
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
