import { useState, useEffect, useCallback, useMemo } from 'react'
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
import ProblemStatsModal from './ProblemStatsModal'
import DailyXpQuests from './DailyXpQuests'
import RevisionScheduleCard from './RevisionScheduleCard'
import { useAdmin } from '../../context/AdminContext'
import { API_BASE_URL } from '../../utils/apiConfig'

function getRevisionCountdown(dueString) {
  if (!dueString) return null
  const today = new Date().toISOString().split('T')[0]
  if (dueString < today) {
    const diffDays = Math.round((new Date(today) - new Date(dueString)) / (1000 * 60 * 60 * 24))
    return { text: `Overdue by ${diffDays}d`, urgency: 'overdue' }
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

function formatRelativeTime(dateString) {
  if (!dateString) return ''
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DsaWorkspace({ onSwitchToCalendar }) {
  const { isAdmin, authFetch } = useAdmin()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'topics' | 'arena' | 'coach' | 'mistakes' | 'achievements'
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedStatsProblemId, setSelectedStatsProblemId] = useState(null)
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
    if (!problem) return
    const normalized = {
      ...problem,
      id: problem.id || problem.problem_id,
      problem_id: problem.id || problem.problem_id,
    }
    setArenaProblem(normalized)
    setActiveTab('arena')
  }

  const handleCompleteAttempt = async (attemptData) => {
    if (!isAdmin) {
      return { success: false, error: 'Admin access required to log attempts. Please log in from the footer.' }
    }
    try {
      const res = await authFetch(`${apiUrl}/api/v1/dsa/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptData),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        // Refresh overview, topics, mistakes
        fetchOverview()
        fetchTopicsAndRevision()
        fetchMistakes()
        return json
      }
      return { success: false, error: json.error || 'Server rejected attempt submission' }
    } catch (err) {
      console.error('Submit attempt failed:', err)
      return { success: false, error: err.message || 'Network error submitting attempt' }
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

  const handleSelectTopic = (topicName) => {
    setSelectedTopic(topicName)
    const effectiveTopic = topicName || 'All'
    const newFilters = { ...filters, topic: effectiveTopic, page: 1 }
    setFilters(newFilters)
    fetchProblems(newFilters)
    setActiveTab('topics')
  }



  const profile = overview?.profile || {}
  const stats = overview?.stats || {}
  const activePlan = overview?.activePlan || null

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 1. Arena Top Navigation & HUD Bar */}
      <div className="p-2.5 sm:p-3 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'overview', label: 'Dashboard & Charts', icon: BarChart3 },
            { id: 'topics', label: 'Topics & Questions', icon: Target },
            { id: 'arena', label: 'Practice Arena', icon: Play },
            { id: 'coach', label: 'AI Coach', icon: Sparkles },
            { id: 'mistakes', label: 'Mistake Journal', icon: AlertTriangle },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'topics' && activeTab === 'topics') {
                    setSelectedTopic(null)
                  }
                  setActiveTab(tab.id)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent text-[#08080C] font-bold shadow-md shadow-accent/10'
                    : 'text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Quick LeetCode Sync */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleSyncLeetCode}
            disabled={syncing}
            title="Sync recent solved submissions from LeetCode"
            className="px-3 py-1.5 rounded-xl border border-hairline bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono text-muted hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-accent' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync LeetCode'}</span>
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
            {/* 2-Column Action Hub: Daily XP Missions & Spaced Repetition Revision Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <DailyXpQuests
                recentAttempts={overview?.recentAttempts || []}
                onSelectTopic={handleSelectTopic}
              />
              <RevisionScheduleCard
                revisionQueue={revisionQueue}
                onLaunchPractice={handleLaunchPractice}
                onViewStats={(id) => setSelectedStatsProblemId(id)}
                onSwitchToCalendar={onSwitchToCalendar}
                onRefresh={() => {
                  fetchOverview()
                  fetchTopicsAndRevision()
                }}
              />
            </div>

            {/* Visual Analytics & Interactive Charts (includes 3-line Solve Times graph & KPIs) */}
            <DsaVisualCharts
              charts={overview?.charts}
              stats={stats}
              recentAttempts={overview?.recentAttempts || []}
              onViewStats={(id) => setSelectedStatsProblemId(id)}
            />

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

            {/* Recently Solved Questions Section */}
            <div className="p-6 sm:p-7 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col gap-5 text-left shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-hairline pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-accent/10 text-accent">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                      <span>Recently Solved Questions</span>
                      <span className="text-xs font-mono text-accent font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                        {overview?.recentAttempts?.length || 0} Solved
                      </span>
                    </h3>
                    <p className="text-xs font-mono text-muted">
                      Your live practice log with solve duration, accuracy, XP, and spaced revision milestones.
                    </p>
                  </div>
                </div>

                {overview?.recentAttempts && overview.recentAttempts.length > 0 && (
                  <button
                    onClick={() => setActiveTab('charts')}
                    className="text-xs font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Velocity Charts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {overview?.recentAttempts && overview.recentAttempts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {overview.recentAttempts.map((item) => {
                    const mins = Math.floor((item.duration_seconds || 0) / 60)
                    const secs = (item.duration_seconds || 0) % 60
                    const formattedDuration = `${mins}m ${secs > 0 ? `${secs}s` : ''}`
                    const isIndependent = item.is_independent === 1
                    const countdown = item.next_revision_due ? getRevisionCountdown(item.next_revision_due) : null

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-white/5 bg-[#12121A] hover:border-accent/30 transition-all flex flex-col justify-between gap-3.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                  item.difficulty === 'Easy'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : item.difficulty === 'Medium'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {item.difficulty}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-hairline uppercase">
                                {item.platform || 'leetcode'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-muted border border-white/5">
                                {item.primary_topic}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-muted">
                              {formatRelativeTime(item.created_at)}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-display font-bold text-white truncate">
                              {item.problem_title}
                            </h4>
                            {item.canonical_url && (
                              <a
                                href={item.canonical_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted hover:text-white p-0.5 shrink-0"
                                title="Open on LeetCode/GFG"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {countdown && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              <span>Scheduled Revision: {item.next_revision_due} ({countdown.text})</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-white/5 text-xs font-mono gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                isIndependent
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {isIndependent ? 'Independent' : 'Assisted'}
                            </span>
                            <span className="text-muted text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-accent" />
                              <span>{formattedDuration}</span>
                            </span>
                            {item.xp_awarded > 0 && (
                              <span className="text-accent text-[11px] font-bold">
                                +{item.xp_awarded} XP
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              onClick={() => setSelectedStatsProblemId(item.problem_id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white/5 hover:bg-white/10 text-white flex items-center gap-1 border border-hairline cursor-pointer transition-colors"
                            >
                              <BarChart3 className="w-3 h-3 text-accent" />
                              <span>View Stats</span>
                            </button>
                            <button
                              onClick={() =>
                                handleLaunchPractice({
                                  id: item.problem_id,
                                  title: item.problem_title,
                                  canonical_url: item.canonical_url,
                                  difficulty: item.difficulty,
                                  primary_topic: item.primary_topic,
                                  platform: item.platform,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-accent/20 hover:bg-accent/30 text-accent flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Practice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-hairline bg-[#12121A] text-center flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-muted/60" />
                  <h4 className="text-sm font-display font-bold text-white">No Solved Questions Yet</h4>
                  <p className="text-xs font-mono text-muted max-w-md">
                    This is a fresh application with 0 dummy records. Pick any problem from the Topics tab or launch the Practice Arena to record your first solve and begin building your streak!
                  </p>
                  <button
                    onClick={() => setActiveTab('topics')}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Browse Question Catalog</span>
                  </button>
                </div>
              )}
            </div>

            {/* Weak Topics & Strategic Focus */}
            <div className="p-6 sm:p-7 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col gap-5 text-left shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-hairline pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <Target className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                      <span>Topics Requiring Attention</span>
                      <span className="text-xs font-mono text-rose-400 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                        {weakTopics.length} Flagged
                      </span>
                    </h3>
                    <p className="text-xs font-mono text-muted">
                      Targeted recommendations based on error rates and practice recency.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectTopic(null)}
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore All Topics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {weakTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {weakTopics.slice(0, 3).map((wt) => (
                    <div
                      key={wt.topic}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-3 hover:border-accent/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-white">
                            {wt.topic}
                          </span>
                          <span className="text-[10px] font-mono text-rose-400 font-bold">
                            {wt.masteryScore}% Mastery
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-muted block">
                          Solved: {wt.solved}/{wt.total} problems
                        </span>
                      </div>

                      <button
                        onClick={() => handleSelectTopic(wt.topic)}
                        className="w-full py-1.5 rounded-xl text-xs font-mono font-medium bg-white/5 hover:bg-white/10 text-white border border-hairline flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>Focus Practice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-hairline bg-[#12121A] text-center flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <p className="text-xs font-mono text-muted">
                    Mastery scores look strong across all attempted topics. Keep practicing consistently to maintain high accuracy!
                  </p>
                </div>
              )}
            </div>
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
              onSelectAnotherProblem={() => {
                setSelectedTopic(null)
                setActiveTab('topics')
              }}
            />
          </motion.div>
        )}

        {/* TOPICS & QUESTIONS UNIFIED TAB */}
        {activeTab === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {selectedTopic === null ? (
              <TopicMasteryView
                topics={topics}
                weakTopics={weakTopics}
                revisionQueue={revisionQueue}
                onSelectProblemForPractice={handleLaunchPractice}
                onSelectTopic={handleSelectTopic}
                onViewStats={(id) => setSelectedStatsProblemId(id)}
              />
            ) : (
              <QuestionBank
                problems={problems}
                pagination={pagination}
                filters={filters}
                onFilterChange={handleFilterChange}
                onPageChange={handlePageChange}
                onSelectProblemForPractice={handleLaunchPractice}
                onBackToTopics={() => setSelectedTopic(null)}
                onViewStats={(id) => setSelectedStatsProblemId(id)}
                loading={loading}
              />
            )}
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

      {/* Problem Stats & Solve History Modal */}
      <AnimatePresence>
        {selectedStatsProblemId && (
          <ProblemStatsModal
            problemId={selectedStatsProblemId}
            onClose={() => setSelectedStatsProblemId(null)}
            onLaunchPractice={handleLaunchPractice}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
