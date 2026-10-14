import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Target,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Play,
  ArrowRight,
  ExternalLink,
  Layers,
  BarChart3,
  PieChart,
  BrainCircuit,
  Award,
  RefreshCw,
  Search,
} from 'lucide-react'
import PracticeArena from './PracticeArena'
import QuestionBank from './QuestionBank'
import AiCoachHub from './AiCoachHub'
import TopicMasteryView from './TopicMasteryView'
import MistakeJournalView from './MistakeJournalView'
import GamificationView from './GamificationView'
import DsaVisualCharts from './DsaVisualCharts'
import { useAdmin } from '../../context/AdminContext'
import { API_BASE_URL } from '../../utils/apiConfig'

export default function DsaWorkspace({ onSwitchToCalendar }) {
  const { isAdmin, authFetch } = useAdmin()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'bank' | 'arena' | 'topics' | 'coach' | 'mistakes' | 'achievements'
  const [loading, setLoading] = useState(true)

  // State
  const [overview, setOverview] = useState(null)
  const [problems, setProblems] = useState([])
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    search: '',
    platform: 'all',
    difficulty: 'all',
    topic: 'All',
    status: 'all',
    sort: 'priority',
    page: 1,
    limit: 20,
  })

  // Selected problem currently loaded in Practice Arena
  const [arenaProblem, setArenaProblem] = useState(null)

  // Topic mastery & Spaced revision
  const [topics, setTopics] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [revisionQueue, setRevisionQueue] = useState({})

  // Mistake journal
  const [mistakes, setMistakes] = useState([])
  const [mistakeAnalytics, setMistakeAnalytics] = useState({})

  // Sync state
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  const apiUrl = API_BASE_URL

  // 1. Fetch Overview (Dashboard, game profile, stats, active plan)
  const fetchOverview = useCallback(async () => {
    try {
      const endpoint = `${apiUrl}/api/v1/dsa/overview`
      const res = await (isAdmin ? authFetch(endpoint) : fetch(endpoint))
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setOverview(json)
        }
      }
    } catch (err) {
      console.warn('Overview fetch error:', err)
    }
  }, [apiUrl, isAdmin, authFetch])

  // 2. Fetch Problems
  const fetchProblems = useCallback(
    async (customFilters = filters) => {
      try {
        const params = new URLSearchParams()
        if (customFilters.search) params.append('search', customFilters.search)
        if (customFilters.platform !== 'all') params.append('platform', customFilters.platform)
        if (customFilters.difficulty !== 'all') params.append('difficulty', customFilters.difficulty)
        if (customFilters.topic && customFilters.topic !== 'All') params.append('topic', customFilters.topic)
        if (customFilters.status !== 'all') params.append('status', customFilters.status)
        if (customFilters.sort) params.append('sort', customFilters.sort)
        params.append('page', customFilters.page || 1)
        params.append('limit', customFilters.limit || 20)

        const endpoint = `${apiUrl}/api/v1/dsa/problems?${params.toString()}`
        const res = await (isAdmin ? authFetch(endpoint) : fetch(endpoint))
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setProblems(json.problems || [])
            setPagination(json.pagination || {})
          }
        }
      } catch (err) {
        console.warn('Problems fetch error:', err)
      }
    },
    [apiUrl, filters, isAdmin, authFetch]
  )

  // 3. Fetch Topics & Revision
  const fetchTopicsAndRevision = useCallback(async () => {
    try {
      const [topicsRes, revRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/dsa/topics`),
        isAdmin ? authFetch(`${apiUrl}/api/v1/dsa/revision`) : fetch(`${apiUrl}/api/v1/dsa/revision`),
      ])

      if (topicsRes.status === 'fulfilled' && topicsRes.value.ok) {
        const tJson = await topicsRes.value.json()
        if (tJson.success) {
          setTopics(tJson.topics || [])
          setWeakTopics(tJson.weakTopics || [])
        }
      }

      if (revRes.status === 'fulfilled' && revRes.value.ok) {
        const rJson = await revRes.value.json()
        if (rJson.success) {
          setRevisionQueue(rJson.queue || {})
        }
      }
    } catch (err) {
      console.warn('Topics/Revision fetch error:', err)
    }
  }, [apiUrl, isAdmin, authFetch])

  // 4. Fetch Mistakes
  const fetchMistakes = useCallback(async () => {
    try {
      const endpoint = `${apiUrl}/api/v1/dsa/mistakes`
      const res = await (isAdmin ? authFetch(endpoint) : fetch(endpoint))
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setMistakes(json.mistakes || [])
          setMistakeAnalytics(json.analytics || {})
        }
      }
    } catch (err) {
      console.warn('Mistakes fetch error:', err)
    }
  }, [apiUrl, isAdmin, authFetch])

  // Initial load
  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetchOverview(),
      fetchProblems(),
      fetchTopicsAndRevision(),
      fetchMistakes(),
    ]).finally(() => {
      setLoading(false)
    })
  }, [fetchOverview, fetchProblems, fetchTopicsAndRevision, fetchMistakes])

  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchProblems(newFilters)
  }

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage }
    setFilters(updated)
    fetchProblems(updated)
  }

  const handleLaunchPractice = (problem) => {
    setArenaProblem(problem)
    setActiveTab('arena')
  }

  const handleCompleteAttempt = async (attemptData) => {
    try {
      const res = await authFetch(`${apiUrl}/api/v1/dsa/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptData),
      })
      if (res.ok) {
        const json = await res.json()
        // Refresh overview, topics, mistakes
        fetchOverview()
        fetchTopicsAndRevision()
        fetchMistakes()
        return json
      }
    } catch (err) {
      console.error('Submit attempt failed:', err)
    }
  }

  const handleGenerateAiPlan = async (durationMinutes) => {
    const res = await authFetch(`${apiUrl}/api/v1/dsa/ai/practice-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_budget_minutes: durationMinutes }),
    })
    if (res.ok) {
      const json = await res.json()
      fetchOverview()
      return json
    }
    throw new Error('AI Generation failed')
  }

  const handleAnalyzeWeaknesses = async () => {
    const res = await authFetch(`${apiUrl}/api/v1/dsa/ai/analyze-weaknesses`, {
      method: 'POST',
    })
    if (res.ok) {
      return await res.json()
    }
    throw new Error('Analysis failed')
  }

  const handleSyncLeetCode = async () => {
    setSyncing(true)
    setSyncStatus(null)
    try {
      const res = await authFetch(`${apiUrl}/api/v1/dsa/sync/leetcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Manash_22' }),
      })
      if (res.ok) {
        const json = await res.json()
        setSyncStatus(`Synced! ${json.importedCount} new problem(s) recorded from LeetCode.`)
        fetchOverview()
        fetchProblems()
      } else {
        setSyncStatus('LeetCode sync encountered an issue. Using cached data.')
      }
    } catch (err) {
      setSyncStatus('Sync request timed out.')
    } finally {
      setSyncing(false)
    }
  }

  const handleTogglePenalties = async (enabled) => {
    try {
      const res = await authFetch(`${apiUrl}/api/v1/dsa/penalties/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (res.ok) {
        fetchOverview()
      }
    } catch (err) {
      console.error('Toggle penalties error:', err)
    }
  }

  const profile = overview?.profile || {}
  const stats = overview?.stats || {}
  const activePlan = overview?.activePlan || null

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 1. Arena Top Navigation & HUD Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'overview', label: 'Dashboard & Charts', icon: BarChart3 },
            { id: 'bank', label: 'Question Bank', icon: BookOpen },
            { id: 'arena', label: 'Practice Arena', icon: Play },
            { id: 'topics', label: 'Topic Mastery', icon: Target },
            { id: 'coach', label: 'AI Coach', icon: Sparkles },
            { id: 'mistakes', label: 'Mistake Journal', icon: AlertTriangle },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent text-[#08080C] font-bold shadow-lg shadow-accent/10'
                    : 'text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Quick Sync & Switcher */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleSyncLeetCode}
            disabled={syncing}
            title="Sync recent solved submissions from LeetCode"
            className="px-3 py-1.5 rounded-xl border border-hairline bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono text-muted hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-accent' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync LeetCode'}</span>
          </button>

          <button
            onClick={onSwitchToCalendar}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-muted hover:text-white border border-hairline hover:bg-white/5 transition-colors cursor-pointer"
          >
            Switch to Calendar ↗
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3 rounded-2xl border border-accent/20 bg-accent/5 text-accent text-xs font-mono flex items-center justify-between">
          <span>{syncStatus}</span>
          <button onClick={() => setSyncStatus(null)} className="text-muted hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* 2. Active Tab Content Container */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-6"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
              {/* Unique Solved */}
              <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-mono">Problems Solved</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-white">
                    {stats.uniqueSolved || 0}
                  </span>
                  <span className="text-xs font-mono text-muted">
                    / {stats.totalProblems || 807} catalog
                  </span>
                </div>
              </div>

              {/* Independent Solves */}
              <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-mono">Independent Solves</span>
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-accent">
                    {stats.independentSolves || 0}
                  </span>
                  <span className="text-xs font-mono text-muted">zero hints</span>
                </div>
              </div>

              {/* Current Streak */}
              <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-mono">Practice Streak</span>
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-white">
                    {profile.current_streak || 0}
                  </span>
                  <span className="text-xs font-mono text-muted">days continuous</span>
                </div>
              </div>

              {/* XP Rank */}
              <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-[#0E0E14] text-left flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-mono">Arena Rank</span>
                  <Trophy className="w-4 h-4 text-purple-400" />
                </div>
                <div className="truncate">
                  <span className="text-lg sm:text-xl font-display font-bold text-white truncate block">
                    {profile.current_level || 'Novice'}
                  </span>
                  <span className="text-xs font-mono text-accent">
                    {profile.total_xp || 0} Total XP
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Analytics & Interactive Charts */}
            <DsaVisualCharts charts={overview?.charts} stats={stats} />

            {/* Active Daily Plan or Launcher Hero */}
            {activePlan ? (
              <div className="p-6 sm:p-8 rounded-3xl border border-hairline bg-[#0E0E14] text-left flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-hairline pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase">
                        Today's Practice Plan
                      </span>
                      <span className="text-xs font-mono text-muted">
                        {activePlan.duration_budget_minutes}m budget
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-bold text-white mt-1">
                      {activePlan.summary || 'Structured DSA session for today'}
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveTab('coach')}
                    className="px-4 py-2 rounded-full text-xs font-mono text-muted hover:text-white border border-hairline hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Adjust with Coach ↗
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePlan.items &&
                    activePlan.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-hairline bg-white/[0.01] hover:border-accent/40 transition-colors flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                item.difficulty === 'Easy'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : item.difficulty === 'Medium'
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}
                            >
                              {item.difficulty}
                            </span>
                            <span className="text-[10px] font-mono text-muted">
                              ~{item.estimated_minutes || 20}m
                            </span>
                          </div>
                          <h4 className="text-sm font-display font-bold text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[11px] font-mono text-muted block mt-0.5">
                            {item.primary_topic}
                          </span>
                        </div>

                        <button
                          onClick={() => handleLaunchPractice(item)}
                          className="w-full py-2 rounded-xl text-xs font-mono font-medium bg-accent text-[#08080C] hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start in Arena</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-mono text-accent uppercase font-bold">
                      Personal Practice Coach
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">
                    Ready for today's practice session?
                  </h3>
                  <p className="text-xs font-mono text-muted max-w-lg">
                    Generate an adaptive practice plan tailored to your weak topics, overdue spaced revisions, and chosen time budget.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('coach')}
                  className="px-6 py-3.5 rounded-full text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 shrink-0 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch AI Coach Hub</span>
                </button>
              </div>
            )}

            {/* Quick Two-Column: Overdue Revisions & Weak Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Due for Revision Card */}
              <div className="p-6 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-display font-bold text-white">
                      Due for Revision
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-medium">
                    {stats.dueRevisionsCount || 0} scheduled
                  </span>
                </div>

                {revisionQueue.overdue && revisionQueue.overdue.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {revisionQueue.overdue.slice(0, 3).map((item) => (
                      <div
                        key={item.problem_id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-mono font-medium text-white block">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted">
                            {item.primary_topic} · Due: {item.next_revision_due}
                          </span>
                        </div>
                        <button
                          onClick={() => handleLaunchPractice(item)}
                          className="px-3 py-1 rounded-lg text-xs font-mono bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 cursor-pointer"
                        >
                          Revise
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-muted py-4">
                    All completed problems are up-to-date with your spaced repetition schedule.
                  </p>
                )}

                <button
                  onClick={() => setActiveTab('topics')}
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>View Revision Queue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Weak Topics Card */}
              <div className="p-6 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-display font-bold text-white">
                      Topics Requiring Attention
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted">
                    {weakTopics.length} flagged
                  </span>
                </div>

                {weakTopics.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {weakTopics.slice(0, 3).map((wt) => (
                      <div
                        key={wt.topic}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-mono font-medium text-white block">
                            {wt.topic}
                          </span>
                          <span className="text-[10px] font-mono text-muted">
                            Mastery: {wt.masteryScore}% · Solved: {wt.solved}/{wt.total}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setFilters({ ...filters, topic: wt.topic, page: 1 })
                            setActiveTab('bank')
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-mono bg-white/5 text-white hover:bg-white/10 cursor-pointer"
                        >
                          Explore
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-muted py-4">
                    Mastery scores look strong across all attempted topics.
                  </p>
                )}

                <button
                  onClick={() => setActiveTab('topics')}
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>Explore Topic Mastery</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* QUESTION BANK TAB */}
        {activeTab === 'bank' && (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <QuestionBank
              problems={problems}
              pagination={pagination}
              filters={filters}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onSelectProblemForPractice={handleLaunchPractice}
              loading={loading}
            />
          </motion.div>
        )}

        {/* PRACTICE ARENA TAB */}
        {activeTab === 'arena' && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <PracticeArena
              activeProblem={arenaProblem}
              onCompleteAttempt={handleCompleteAttempt}
              onSelectAnotherProblem={() => setActiveTab('bank')}
            />
          </motion.div>
        )}

        {/* TOPIC MASTERY TAB */}
        {activeTab === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <TopicMasteryView
              topics={topics}
              weakTopics={weakTopics}
              revisionQueue={revisionQueue}
              onSelectProblemForPractice={handleLaunchPractice}
            />
          </motion.div>
        )}

        {/* AI COACH TAB */}
        {activeTab === 'coach' && (
          <motion.div
            key="coach"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <AiCoachHub
              activePlan={activePlan}
              onGeneratePlan={handleGenerateAiPlan}
              onAnalyzeWeaknesses={handleAnalyzeWeaknesses}
              onSelectProblemForPractice={handleLaunchPractice}
            />
          </motion.div>
        )}

        {/* MISTAKE JOURNAL TAB */}
        {activeTab === 'mistakes' && (
          <motion.div
            key="mistakes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <MistakeJournalView
              mistakes={mistakes}
              analytics={mistakeAnalytics}
              onSelectProblemForPractice={handleLaunchPractice}
            />
          </motion.div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <GamificationView
              profile={profile}
              onTogglePenalties={handleTogglePenalties}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
