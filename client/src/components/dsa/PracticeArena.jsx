import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  ExternalLink,
  Award,
  Zap,
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react'

export default function PracticeArena({
  activeProblem,
  onCompleteAttempt,
  onSelectAnotherProblem,
}) {
  const [seconds, setSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [solutionViewed, setSolutionViewed] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Completion modal form state
  const [result, setResult] = useState('solved') // 'solved' | 'attempted_unsolved'
  const [confidence, setConfidence] = useState(4)
  const [difficultyExp, setDifficultyExp] = useState('medium')
  const [language, setLanguage] = useState('Java')
  const [notes, setNotes] = useState('')
  const [linkToCalendar, setLinkToCalendar] = useState(true)

  // Mistake reflection
  const [hasMistake, setHasMistake] = useState(false)
  const [mistakeCategory, setMistakeCategory] = useState('edge_cases')
  const [mistakeDesc, setMistakeDesc] = useState('')
  const [lessonLearned, setLessonLearned] = useState('')

  // Reward result state
  const [attemptResult, setAttemptResult] = useState(null)

  // Timer interval
  useEffect(() => {
    let interval = null
    if (timerRunning) {
      if (!startTime) setStartTime(new Date().toISOString())
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timerRunning, startTime])

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleStartPause = () => {
    setTimerRunning((prev) => !prev)
  }

  const handleReset = () => {
    setTimerRunning(false)
    setSeconds(0)
    setStartTime(null)
    setHintsUsed(0)
    setSolutionViewed(false)
  }

  const handleFinishAttempt = () => {
    setTimerRunning(false)
    setIsFinishing(true)
  }

  const handleSubmitAttempt = async (e) => {
    e.preventDefault()
    if (!activeProblem) return
    setIsSubmitting(true)

    const isIndependent = !solutionViewed && hintsUsed === 0

    const mistakes = []
    if (hasMistake && mistakeDesc.trim()) {
      mistakes.push({
        category: mistakeCategory,
        mistake_description: mistakeDesc.trim(),
        lesson_learned: lessonLearned.trim(),
      })
    }

    try {
      const res = await onCompleteAttempt({
        problem_id: activeProblem.id,
        started_at: startTime || new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: seconds,
        result,
        is_independent: isIndependent ? 1 : 0,
        hints_used: hintsUsed,
        solution_viewed: solutionViewed ? 1 : 0,
        language,
        confidence_rating: confidence,
        difficulty_experienced: difficultyExp,
        notes,
        mistakes,
        linkToCalendar,
      })

      if (res && res.success) {
        setAttemptResult(res)
      }
    } catch (err) {
      console.error('Failed to submit attempt:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!activeProblem) {
    return (
      <div className="w-full py-16 px-6 rounded-2xl border border-hairline bg-[#0E0E14] text-center flex flex-col items-center justify-center gap-4">
        <Clock className="w-10 h-10 text-muted" />
        <h3 className="text-lg font-display font-semibold text-white">No Problem Selected</h3>
        <p className="text-xs font-mono text-muted max-w-md">
          Pick a problem from your Question Bank, Daily Practice Plan, or Due Revision queue to launch the Practice Arena.
        </p>
        <button
          onClick={onSelectAnotherProblem}
          className="mt-2 px-5 py-2.5 rounded-full text-xs font-mono font-medium bg-accent text-[#08080C] hover:opacity-90 flex items-center gap-2 cursor-pointer"
        >
          <span>Browse Question Bank</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  const targetMinutes = activeProblem.estimated_solve_time || 20
  const isOverTarget = seconds > targetMinutes * 60

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Problem Header Bar */}
      <div className="p-5 sm:p-6 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                activeProblem.difficulty === 'Easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : activeProblem.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {activeProblem.difficulty}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-hairline uppercase">
              {activeProblem.platform}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
              {activeProblem.primary_topic}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            {activeProblem.title}
          </h2>
          {activeProblem.patterns && activeProblem.patterns.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono text-muted">Patterns:</span>
              {activeProblem.patterns.map((pt, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-[#EDEDF2] border border-white/5"
                >
                  {pt}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action button to external platform */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={activeProblem.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-full text-xs font-mono font-medium bg-white/5 hover:bg-white/10 text-white border border-hairline flex items-center gap-1.5 transition-colors"
          >
            <span>Open on {activeProblem.platform === 'leetcode' ? 'LeetCode' : 'GFG'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onSelectAnotherProblem}
            className="px-3 py-2.5 rounded-full text-xs font-mono text-muted hover:text-white border border-hairline hover:bg-white/5 transition-colors cursor-pointer"
          >
            Switch
          </button>
        </div>
      </div>

      {/* 2. Interactive Timer HUD & Tooling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Practice Arena Timer</span>
            </span>
            <span className="text-xs font-mono">
              Target: <span className="text-white font-medium">{targetMinutes}:00</span>
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            <span
              className={`text-6xl sm:text-7xl font-mono font-bold tracking-tight ${
                isOverTarget ? 'text-amber-400' : 'text-white'
              }`}
            >
              {formatTimer(seconds)}
            </span>
            <span className="text-xs font-mono text-muted mt-2">
              {timerRunning
                ? 'Timer active — stay focused'
                : seconds > 0
                ? 'Timer paused'
                : 'Click Start when ready to begin'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleStartPause}
              className={`px-6 py-3 rounded-full text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-transform active:scale-95 ${
                timerRunning
                  ? 'bg-amber-400 text-[#08080C] hover:bg-amber-300'
                  : 'bg-accent text-[#08080C] hover:opacity-90'
              }`}
            >
              {timerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{seconds > 0 ? 'Resume Timer' : 'Start Session'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleFinishAttempt}
              className="px-5 py-3 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish & Record</span>
            </button>

            <button
              onClick={handleReset}
              className="p-3 rounded-full text-muted hover:text-white border border-hairline hover:bg-white/5 transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Practice Session Tracker & Honesty Flags */}
        <div className="p-6 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col justify-between gap-4 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Session Honesty & Integrity</span>
            </span>
            <p className="text-[11px] font-mono text-muted mt-1 leading-relaxed">
              Track assistance honestly. Independent solves grant +30 XP bonus and advance your mastery score.
            </p>
          </div>

          <div className="flex flex-col gap-3 py-2 border-y border-hairline">
            {/* Hints counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-white">Hints Used</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHintsUsed((prev) => Math.max(0, prev - 1))}
                  className="w-6 h-6 rounded bg-white/5 text-xs font-mono hover:bg-white/10 text-white cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold text-white w-4 text-center">
                  {hintsUsed}
                </span>
                <button
                  type="button"
                  onClick={() => setHintsUsed((prev) => prev + 1)}
                  className="w-6 h-6 rounded bg-white/5 text-xs font-mono hover:bg-white/10 text-white cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Viewed editorial */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-mono text-white">Viewed Solution</span>
              </div>
              <input
                type="checkbox"
                checked={solutionViewed}
                onChange={(e) => setSolutionViewed(e.target.checked)}
                className="w-4 h-4 accent-accent rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-white font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-accent" />
              <span>Expected Reward:</span>
            </span>
            <span className="text-xs font-mono text-muted">
              {!solutionViewed && hintsUsed === 0
                ? '⭐ Independent Solve: +80 XP (+50 Base + 30 Bonus)'
                : '💡 Assisted Solve: +50 XP (Honest attempt logged)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Completion & Reflection Modal */}
      <AnimatePresence>
        {isFinishing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-hairline bg-[#0E0E14] p-6 sm:p-8 flex flex-col gap-6 text-left shadow-2xl"
            >
              {/* Attempt result banner if completed */}
              {attemptResult ? (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">Session Recorded!</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-accent text-[#08080C]">
                      +{attemptResult.xpEarned} XP Awarded
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-white border border-hairline">
                      🔥 Streak: {attemptResult.rewardInfo?.streak} Days
                    </span>
                  </div>

                  {attemptResult.revisionUpdate && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-hairline w-full text-xs font-mono text-muted">
                      📅 Next Spaced Revision Scheduled for:{' '}
                      <span className="text-white font-bold">
                        {attemptResult.revisionUpdate.next_revision_due}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsFinishing(false)
                      setAttemptResult(null)
                      handleReset()
                      onSelectAnotherProblem()
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full text-xs font-mono font-medium bg-accent text-[#08080C] hover:opacity-90 cursor-pointer"
                  >
                    Done & Return to Arena
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAttempt} className="flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-hairline pb-4">
                    <div>
                      <h3 className="text-lg font-display font-bold text-white">
                        Record Practice Attempt
                      </h3>
                      <span className="text-xs font-mono text-muted">
                        Duration: {formatTimer(seconds)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFinishing(false)}
                      className="text-muted hover:text-white text-xs font-mono p-1"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Result selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted">Outcome</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setResult('solved')}
                        className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                          result === 'solved'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                            : 'bg-white/[0.02] border-hairline text-muted hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Solved</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResult('attempted_unsolved')}
                        className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                          result === 'attempted_unsolved'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold'
                            : 'bg-white/[0.02] border-hairline text-muted hover:text-white'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Unsolved / Stuck</span>
                      </button>
                    </div>
                  </div>

                  {/* Confidence & Difficulty Experienced */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted">
                        Confidence (1-5): {confidence}★
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={confidence}
                        onChange={(e) => setConfidence(parseInt(e.target.value, 10))}
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white"
                      >
                        <option value="Java">Java</option>
                        <option value="C++">C++</option>
                        <option value="Python">Python</option>
                        <option value="JavaScript">JavaScript</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes & Approach */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted">Notes & Algorithmic Approach</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Used two pointers converging from ends. Time O(N), Space O(1)."
                      rows={2}
                      className="w-full p-3 rounded-xl bg-[#14141E] border border-hairline text-xs font-mono text-white placeholder:text-muted/50 focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Mistake Journal Accordion */}
                  <div className="p-4 rounded-xl border border-hairline bg-white/[0.01] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-medium text-white">
                          Log to Mistake Journal? (+15 XP)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasMistake}
                        onChange={(e) => setHasMistake(e.target.checked)}
                        className="w-4 h-4 accent-accent rounded cursor-pointer"
                      />
                    </div>

                    {hasMistake && (
                      <div className="flex flex-col gap-3 pt-2 border-t border-hairline">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-mono text-muted">Category</label>
                          <select
                            value={mistakeCategory}
                            onChange={(e) => setMistakeCategory(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#14141E] border border-hairline text-xs font-mono text-white"
                          >
                            <option value="edge_cases">Edge Cases Missed</option>
                            <option value="conceptual_gap">Conceptual Gap</option>
                            <option value="pattern_recognition">Pattern Recognition</option>
                            <option value="implementation_bug">Implementation Bug</option>
                            <option value="complexity_analysis">Complexity / TLE</option>
                            <option value="language_syntax">Language / API Syntax</option>
                            <option value="careless_error">Careless Error</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-mono text-muted">What went wrong?</label>
                          <input
                            type="text"
                            value={mistakeDesc}
                            onChange={(e) => setMistakeDesc(e.target.value)}
                            placeholder="e.g. Forgot boundary check when array length is 0"
                            className="w-full px-3 py-2 rounded-lg bg-[#14141E] border border-hairline text-xs font-mono text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-mono text-muted">Lesson for next time</label>
                          <input
                            type="text"
                            value={lessonLearned}
                            onChange={(e) => setLessonLearned(e.target.value)}
                            placeholder="e.g. Always check n=0 and n=1 test cases before submission"
                            className="w-full px-3 py-2 rounded-lg bg-[#14141E] border border-hairline text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sync to Calendar checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="linkCalendar"
                      checked={linkToCalendar}
                      onChange={(e) => setLinkToCalendar(e.target.checked)}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                    <label
                      htmlFor="linkCalendar"
                      className="text-xs font-mono text-muted flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span>Sync session as learning event in Second Brain calendar</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-full text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Recording...' : 'Submit Attempt & Claim XP'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
