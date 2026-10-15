import { useState } from 'react'
import {
  Sparkles,
  Clock,
  Zap,
  Target,
  ArrowRight,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'

export default function AiCoachHub({
  activePlan,
  onGeneratePlan,
  onAnalyzeWeaknesses,
  onSelectProblemForPractice,
}) {
  const { isAdmin } = useAdmin()
  const [durationBudget, setDurationBudget] = useState(45)
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState('') // 'plan' | 'analysis'
  const [planResult, setPlanResult] = useState(activePlan || null)
  const [weaknessAnalysis, setWeaknessAnalysis] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleGenerate = async () => {
    if (!isAdmin) {
      setErrorMessage('Portfolio Showcase Mode: Administrator access is required to generate live AI practice plans.')
      return
    }
    setLoading(true)
    setLoadingType('plan')
    setErrorMessage(null)
    try {
      const res = await onGeneratePlan(durationBudget)
      if (res && res.plan) {
        setPlanResult(res.plan)
      } else {
        throw new Error('No plan returned')
      }
    } catch (err) {
      console.error('AI plan error:', err)
      setErrorMessage(err.message || 'Unable to generate practice plan.')
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  const handleAnalyze = async () => {
    if (!isAdmin) {
      setErrorMessage('Portfolio Showcase Mode: Administrator access is required to run weakness diagnostics.')
      return
    }
    setLoading(true)
    setLoadingType('analysis')
    setErrorMessage(null)
    try {
      const res = await onAnalyzeWeaknesses()
      if (res && res.analysis) {
        setWeaknessAnalysis(res.analysis)
      }
    } catch (err) {
      console.error('AI weakness analysis error:', err)
      setErrorMessage(err.message || 'Unable to analyze weak topics.')
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* 1. Coach Control Center */}
      <div className="p-6 sm:p-8 rounded-3xl border border-hairline bg-[#0E0E14] relative overflow-hidden flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/20">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono text-accent uppercase tracking-wider font-semibold">
                On-Demand Practice Coach
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
              AI DSA Training Coach
            </h2>
            <p className="text-xs font-mono text-muted max-w-xl leading-relaxed">
              Synthesizes your real solving history, overdue spaced-repetition schedules, and weakest topic metrics to recommend a balanced practice session. Runs only on your explicit command.
            </p>
          </div>

          {/* Time Budget Selector */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[11px] font-mono text-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Session Duration Budget:</span>
            </span>
            <div className="flex items-center gap-1.5 bg-[#14141E] p-1 rounded-xl border border-hairline">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDurationBudget(mins)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    durationBudget === mins
                      ? 'bg-accent text-[#08080C] font-bold'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-hairline">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-full text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            {loading && loadingType === 'plan' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Consulting AI Coach...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Today's Practice Plan ({durationBudget}m)</span>
              </>
            )}
          </button>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-3 rounded-full text-xs font-mono font-semibold bg-white/5 hover:bg-white/10 text-white border border-hairline disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading && loadingType === 'analysis' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Weaknesses...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 text-accent" />
                <span>Analyze Weak Topics</span>
              </>
            )}
          </button>

          <div className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Problem IDs verified against SQLite</span>
          </div>
        </div>
      </div>

      {/* Error notification if any */}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Weakness Analysis Card (if triggered) */}
      {weaknessAnalysis && (
        <div className="p-6 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              <span>Topic Mastery & Mistake Diagnosis</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted uppercase">
              {weaknessAnalysis.provider || 'deterministic'}
            </span>
          </div>

          <p className="text-xs font-mono text-white/90 leading-relaxed">
            {weaknessAnalysis.weakTopicsSummary}
          </p>

          {weaknessAnalysis.actionableAdvice && weaknessAnalysis.actionableAdvice.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {weaknessAnalysis.actionableAdvice.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1"
                >
                  <span className="text-xs font-mono font-bold text-accent">{item.topic}</span>
                  <span className="text-[11px] font-mono text-muted">{item.recommendation}</span>
                </div>
              ))}
            </div>
          )}

          {weaknessAnalysis.topMistakeNote && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
              💡 {weaknessAnalysis.topMistakeNote}
            </div>
          )}
        </div>
      )}

      {/* 3. Generated Practice Plan */}
      {planResult && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-display font-bold text-white">Curated Practice Plan</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-medium">
                {planResult.duration_budget_minutes}m budget
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-hairline">
                {planResult.generated_by}
              </span>
            </div>
            {planResult.fallback && (
              <span className="text-[10px] font-mono text-amber-400">
                ⚡ Deterministic Rule Engine
              </span>
            )}
          </div>

          {planResult.summary && (
            <div className="p-4 rounded-2xl border border-hairline bg-[#0E0E14] text-xs font-mono text-[#EDEDF2]/90 leading-relaxed">
              🎯 <span className="font-semibold text-white">Strategy:</span> {planResult.summary}
            </div>
          )}

          {/* Recommended Problem Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planResult.items &&
              planResult.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-hairline bg-[#0E0E14] hover:border-accent/40 transition-colors flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                            item.difficulty === 'Easy'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : item.difficulty === 'Medium'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted uppercase">
                          {item.platform}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">
                          {item.primary_topic}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-hairline capitalize">
                        {item.activity_type ? item.activity_type.replace('_', ' ') : 'Practice'}
                      </span>
                    </div>

                    <h4 className="text-base font-display font-bold text-white mt-1">
                      {item.title}
                    </h4>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-mono text-muted">
                      💡 {item.reason}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs font-mono">
                    <span className="text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>~{item.estimated_minutes || 20}m</span>
                    </span>

                    <button
                      onClick={() => onSelectProblemForPractice(item)}
                      className="px-4 py-1.5 rounded-full text-xs font-mono font-medium bg-accent text-[#08080C] hover:opacity-90 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                    >
                      <span>Start in Arena</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
