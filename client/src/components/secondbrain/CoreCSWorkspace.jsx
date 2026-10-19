import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { API_BASE_URL } from '../../utils/apiConfig'
import { useAdmin } from '../../context/AdminContext'
import {
  Brain,
  Cpu,
  Database,
  Globe,
  Layers,
  Code2,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  BookOpen,
  ArrowRight,
  Flame,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Tag,
  Trophy,
} from 'lucide-react'

const SUBJECT_CONFIG = {
  'OS': {
    name: 'Operating Systems',
    color: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.15)',
    border: 'rgba(0, 240, 255, 0.3)',
    icon: Cpu,
  },
  'DBMS': {
    name: 'DBMS & SQL',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: Database,
  },
  'CN': {
    name: 'Computer Networks',
    color: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: Globe,
  },
  'System Design': {
    name: 'System Design',
    color: '#B8FF3C',
    glow: 'rgba(184, 255, 60, 0.15)',
    border: 'rgba(184, 255, 60, 0.3)',
    icon: Layers,
  },
  'OOPs': {
    name: 'OOPs & LLD',
    color: '#C084FC',
    glow: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.3)',
    icon: Code2,
  },
}

export default function CoreCSWorkspace({ onSwitchToCalendar }) {
  const { authFetch } = useAdmin()

  // Workspace Mode: 'drill' | 'vault' | 'sheets' | 'stats'
  const [activeTab, setActiveTab] = useState('drill')

  // Selected subject filter: 'All' | 'OS' | 'DBMS' | 'CN' | 'System Design' | 'OOPs'
  const [selectedSubject, setSelectedSubject] = useState('All')

  // Drill state
  const [drillDeck, setDrillDeck] = useState([])
  const [drillIdx, setDrillIdx] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [drillLoading, setDrillLoading] = useState(true)
  const [drillReviewing, setDrillReviewing] = useState(false)
  const [rewardToast, setRewardToast] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Vault state
  const [vaultCards, setVaultCards] = useState([])
  const [vaultLoading, setVaultLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'due' | 'mastered' | 'learning' | 'unreviewed'
  const [previewCard, setPreviewCard] = useState(null)

  // Cheat Sheets state
  const [cheatSheets, setCheatSheets] = useState([])
  const [sheetsLoading, setSheetsLoading] = useState(false)

  // Stats state
  const [stats, setStats] = useState(null)

  // Custom Card Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [customForm, setCustomForm] = useState({
    subject: 'OS',
    subtopic: '',
    title: '',
    question: '',
    answer_markdown: '',
    key_takeaway: '',
    difficulty: 'Standard',
    code_snippet: '',
    code_language: 'cpp',
  })
  const [isSubmittingCard, setIsSubmittingCard] = useState(false)

  // 1. Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/stats`)
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.warn('Failed to fetch Core CS stats:', err)
    }
  }, [])

  // 2. Fetch Drill Deck
  const fetchDrillDeck = useCallback(async () => {
    setDrillLoading(true)
    setIsAnswerRevealed(false)
    setDrillIdx(0)
    try {
      const params = new URLSearchParams()
      if (selectedSubject !== 'All') params.append('subject', selectedSubject)

      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/drill?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setDrillDeck(data.deck || [])
      }
    } catch (err) {
      console.error('Failed to load drill deck:', err)
    } finally {
      setDrillLoading(false)
    }
  }, [selectedSubject])

  // 3. Fetch Vault Cards
  const fetchVaultCards = useCallback(async () => {
    setVaultLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSubject !== 'All') params.append('subject', selectedSubject)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/cards?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setVaultCards(data.cards || [])
      }
    } catch (err) {
      console.error('Failed to load vault cards:', err)
    } finally {
      setVaultLoading(false)
    }
  }, [selectedSubject, statusFilter, searchQuery])

  // 4. Fetch Cheat Sheets
  const fetchCheatSheets = useCallback(async () => {
    setSheetsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSubject !== 'All') params.append('subject', selectedSubject)

      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/cheat-sheets?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setCheatSheets(data.sheets || [])
      }
    } catch (err) {
      console.error('Failed to load cheat sheets:', err)
    } finally {
      setSheetsLoading(false)
    }
  }, [selectedSubject])

  // Initial load
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (activeTab === 'drill') {
      fetchDrillDeck()
    } else if (activeTab === 'vault') {
      fetchVaultCards()
    } else if (activeTab === 'sheets') {
      fetchCheatSheets()
    }
  }, [activeTab, selectedSubject, fetchDrillDeck, fetchVaultCards, fetchCheatSheets])

  // Submit Active Recall Rating (SM-2)
  const handleRateCard = async (quality) => {
    const currentCard = drillDeck[drillIdx]
    if (!currentCard || drillReviewing) return

    setDrillReviewing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: currentCard.id,
          quality,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setRewardToast({
          xp: data.xp_earned || 15,
          nextDate: data.next_review_at,
          mastered: data.is_mastered,
        })
        setTimeout(() => setRewardToast(null), 2500)

        // Advance to next card or finish deck
        setIsAnswerRevealed(false)
        setDrillIdx((prev) => prev + 1)
        fetchStats()
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
    } finally {
      setDrillReviewing(false)
    }
  }

  // Handle custom card creation
  const handleCreateCard = async (e) => {
    e.preventDefault()
    if (!customForm.title || !customForm.question || !customForm.answer_markdown) return

    setIsSubmittingCard(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/core-cs/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm),
      })
      const data = await res.json()
      if (data.success) {
        setIsAddModalOpen(false)
        setCustomForm({
          subject: 'OS',
          subtopic: '',
          title: '',
          question: '',
          answer_markdown: '',
          key_takeaway: '',
          difficulty: 'Standard',
          code_snippet: '',
          code_language: 'cpp',
        })
        fetchStats()
        if (activeTab === 'vault') fetchVaultCards()
        if (activeTab === 'drill') fetchDrillDeck()
      }
    } catch (err) {
      console.error('Failed to create custom card:', err)
    } finally {
      setIsSubmittingCard(false)
    }
  }

  // Copy code helper
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const currentCard = drillDeck[drillIdx]
  const isDeckComplete = !drillLoading && (drillDeck.length === 0 || drillIdx >= drillDeck.length)

  return (
    <div className="w-full text-[#EDEDF2] space-y-6 select-text">
      {/* Top HUD Banner: Subject Mastery Rings & Quick Stats */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0E0E14] border border-white/5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-white">
                  Core CS Fundamentals Arena
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-400/10 text-purple-400 border border-purple-400/30">
                  SM-2 Active Recall
                </span>
              </div>
              <p className="text-xs text-[#8A8A99] font-mono">
                OS • DBMS & SQL • Computer Networks • System Design • OOPs & LLD
              </p>
            </div>
          </div>

          {/* Quick Learning KPI Counter */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span className="text-[#8A8A99]">Total Cards:</span>
              <strong className="text-white">{stats?.totalCards || 0}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mastered:</span>
              <strong>{stats?.masteredCards || 0} ({stats?.masteryPercentage || 0}%)</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Due Today:</span>
              <strong>{stats?.dueToday || 0}</strong>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-700"
            style={{ width: `${stats?.masteryPercentage || 0}%` }}
          />
        </div>
      </div>

      {/* Primary Navigation Ribbon: Drill vs Vault vs Cheat Sheets */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#0E0E14] border border-white/5">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('drill')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'drill'
                ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                : 'text-[#8A8A99] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Active Recall Drill</span>
            {stats?.dueToday > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-[#08080C] text-[10px] font-bold flex items-center justify-center">
                {stats.dueToday}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'vault'
                ? 'bg-white/10 text-white font-bold shadow-sm border border-white/10'
                : 'text-[#8A8A99] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Question Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'sheets'
                ? 'bg-white/10 text-white font-bold shadow-sm border border-white/10'
                : 'text-[#8A8A99] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#B8FF3C]" />
            <span>Rapid Cheat Sheets</span>
          </button>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
          {['All', 'OS', 'DBMS', 'CN', 'System Design', 'OOPs'].map((sub) => {
            const isSelected = selectedSubject === sub
            const conf = SUBJECT_CONFIG[sub]
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                style={{
                  color: isSelected && conf ? conf.color : undefined,
                  borderColor: isSelected && conf ? conf.border : undefined,
                  backgroundColor: isSelected && conf ? conf.glow : undefined,
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  isSelected
                    ? 'border-white/20 bg-white/10 text-white font-bold'
                    : 'border-white/5 bg-white/[0.02] text-[#8A8A99] hover:text-white hover:border-white/10'
                }`}
              >
                {sub}
              </button>
            )
          })}
        </div>
      </div>

      {/* Floating XP & Calendar Scheduling Toast */}
      <AnimatePresence>
        {rewardToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-2xl bg-[#0E0E14] border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs font-mono text-emerald-400"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>+{rewardToast.xp} XP Earned!</span>
                {rewardToast.mastered && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">
                    Mastered 🎉
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8A8A99]">
                Next review scheduled in Calendar: {rewardToast.nextDate}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE RECALL DRILL (FLASHCARDS WITH SM-2) */}
      {/* ========================================================================= */}
      {activeTab === 'drill' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {drillLoading ? (
            <div className="p-12 text-center rounded-2xl bg-[#0E0E14] border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-mono text-[#8A8A99]">Generating active recall deck...</p>
            </div>
          ) : isDeckComplete ? (
            <div className="p-12 text-center rounded-2xl bg-gradient-to-b from-[#0E0E14] to-[#12121c] border border-emerald-500/30 space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Active Recall Drill Complete!
              </h3>
              <p className="text-xs font-mono text-[#8A8A99] max-w-md mx-auto leading-relaxed">
                You have reviewed all due cards for {selectedSubject === 'All' ? 'all subjects' : selectedSubject}. Your spaced repetition dates have been synced with your calendar.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={fetchDrillDeck}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice Deck Again</span>
                </button>
                <button
                  onClick={() => setActiveTab('vault')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-purple-500 text-white hover:bg-purple-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Browse Question Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card Meta & Header */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8A8A99]">
                <div className="flex items-center gap-2">
                  <span>Card {drillIdx + 1} of {drillDeck.length}</span>
                  <span>•</span>
                  <span className="text-white font-medium">{currentCard.subtopic}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {currentCard.repetition_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-cyan-400">
                      Streak: {currentCard.repetition_count} reviews
                    </span>
                  )}
                  {currentCard.is_mastered === 1 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ✓ Mastered
                    </span>
                  )}
                </div>
              </div>

              {/* The Interactive Flashcard Box */}
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0E0E14] border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-300">
                {/* Subject Color Line on Top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: SUBJECT_CONFIG[currentCard.subject]?.color || '#B8FF3C' }}
                />

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border"
                    style={{
                      color: SUBJECT_CONFIG[currentCard.subject]?.color,
                      backgroundColor: SUBJECT_CONFIG[currentCard.subject]?.glow,
                      borderColor: SUBJECT_CONFIG[currentCard.subject]?.border,
                    }}
                  >
                    {currentCard.subject}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/80 bg-white/5 border border-white/10">
                    {currentCard.difficulty}
                  </span>

                  {currentCard.interview_frequency && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/30 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      {currentCard.interview_frequency}
                    </span>
                  )}
                </div>

                {/* Question */}
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-4 leading-snug">
                  {currentCard.title}
                </h3>
                <p className="text-sm sm:text-base text-[#EDEDF2]/90 leading-relaxed font-normal mb-6">
                  {currentCard.question}
                </p>

                {/* Reveal Answer Button */}
                {!isAnswerRevealed ? (
                  <button
                    onClick={() => setIsAnswerRevealed(true)}
                    className="w-full py-4 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-2 group hover:border-purple-400/50"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Reveal Deep Answer & Code Explanation</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-6 border-t border-white/10"
                  >
                    {/* Key Takeaway Callout */}
                    {currentCard.key_takeaway && (
                      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Active Recall Anchor: </strong>
                          <span>{currentCard.key_takeaway}</span>
                        </div>
                      </div>
                    )}

                    {/* Rich Explanation */}
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[#EDEDF2]/90 whitespace-pre-line font-normal">
                      {currentCard.answer_markdown}
                    </div>

                    {/* Code Snippet Box (if any) */}
                    {currentCard.code_snippet && (
                      <div className="rounded-xl overflow-hidden bg-[#08080C] border border-white/10 shadow-lg">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5 text-[11px] font-mono text-[#8A8A99]">
                          <span className="text-cyan-400 uppercase">{currentCard.code_language || 'code'}</span>
                          <button
                            onClick={() => handleCopyCode(currentCard.code_snippet)}
                            className="text-xs text-[#8A8A99] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono overflow-x-auto text-[#EDEDF2] leading-relaxed">
                          <code>{currentCard.code_snippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* ASCII Diagram Box (if any) */}
                    {currentCard.diagram_ascii && (
                      <div className="p-4 rounded-xl bg-[#08080C] border border-white/10 font-mono text-[11px] sm:text-xs text-cyan-300/90 overflow-x-auto whitespace-pre leading-relaxed">
                        {currentCard.diagram_ascii}
                      </div>
                    )}

                    {/* SM-2 Spaced Repetition Response Controls */}
                    <div className="pt-6 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white font-semibold">How well did you recall this concept?</span>
                        <span className="text-[#8A8A99] text-[11px]">Schedules next calendar date</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => handleRateCard(1)}
                          disabled={drillReviewing}
                          className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-mono transition-all cursor-pointer text-left"
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>Again</span>
                            <span className="text-[10px] opacity-75">&lt; 1d</span>
                          </div>
                          <div className="text-[10px] text-rose-300/80 mt-1">Forgot concept</div>
                        </button>

                        <button
                          onClick={() => handleRateCard(2)}
                          disabled={drillReviewing}
                          className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono transition-all cursor-pointer text-left"
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>Hard</span>
                            <span className="text-[10px] opacity-75">1-2d</span>
                          </div>
                          <div className="text-[10px] text-amber-300/80 mt-1">Struggled to recall</div>
                        </button>

                        <button
                          onClick={() => handleRateCard(3)}
                          disabled={drillReviewing}
                          className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono transition-all cursor-pointer text-left"
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>Good</span>
                            <span className="text-[10px] opacity-75">~4d</span>
                          </div>
                          <div className="text-[10px] text-cyan-300/80 mt-1">Recalled correctly</div>
                        </button>

                        <button
                          onClick={() => handleRateCard(4)}
                          disabled={drillReviewing}
                          className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono transition-all cursor-pointer text-left"
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>Easy</span>
                            <span className="text-[10px] opacity-75">7d+</span>
                          </div>
                          <div className="text-[10px] text-emerald-300/80 mt-1">Mastered cold</div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUESTION VAULT & SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {/* Vault Search & Filter Ribbon */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0E0E14] border border-white/5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A8A99] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions, code snippets, algorithms, subtopics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-[#8A8A99] focus:outline-none focus:border-purple-400/50"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
              {[
                { id: 'all', label: 'All Cards' },
                { id: 'due', label: 'Due' },
                { id: 'mastered', label: 'Mastered' },
                { id: 'learning', label: 'Learning' },
                { id: 'unreviewed', label: 'New' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-[#8A8A99] hover:text-white bg-white/[0.02]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List Grid */}
          {vaultLoading ? (
            <div className="p-12 text-center text-xs font-mono text-[#8A8A99]">
              Loading cards...
            </div>
          ) : vaultCards.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0E0E14] border border-white/5 text-xs font-mono text-[#8A8A99]">
              No questions found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaultCards.map((card) => {
                const conf = SUBJECT_CONFIG[card.subject]
                return (
                  <div
                    key={card.id}
                    onClick={() => setPreviewCard(card)}
                    className="p-5 rounded-2xl bg-[#0E0E14] border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-3 group shadow-md hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border"
                          style={{
                            color: conf?.color,
                            backgroundColor: conf?.glow,
                            borderColor: conf?.border,
                          }}
                        >
                          {card.subject}
                        </span>
                        <span className="text-[11px] font-mono text-[#8A8A99] truncate max-w-[140px]">
                          {card.subtopic}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        {card.is_mastered === 1 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Mastered
                          </span>
                        ) : card.repetition_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                            Learning ({card.interval_days}d)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#8A8A99]">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                      {card.title}
                    </h4>

                    <p className="text-xs text-[#8A8A99] line-clamp-2 leading-relaxed">
                      {card.key_takeaway || card.question}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8A99] pt-2 border-t border-white/5">
                      <span className="text-amber-400/90">{card.interview_frequency || 'Core CS'}</span>
                      <span className="text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Inspect Concept →
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RAPID CHEAT SHEETS (PRE-INTERVIEW CONTRAST TABLES) */}
      {/* ========================================================================= */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          {sheetsLoading ? (
            <div className="p-12 text-center text-xs font-mono text-[#8A8A99]">
              Loading cheat sheets...
            </div>
          ) : cheatSheets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0E0E14] border border-white/5 text-xs font-mono text-[#8A8A99]">
              No cheat sheets found for {selectedSubject}.
            </div>
          ) : (
            cheatSheets.map((sheet) => {
              const conf = SUBJECT_CONFIG[sheet.subject]
              const table = sheet.comparison_table
              const rules = sheet.key_rules || []

              return (
                <div
                  key={sheet.id}
                  className="p-6 rounded-2xl bg-[#0E0E14] border border-white/10 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border"
                        style={{
                          color: conf?.color,
                          backgroundColor: conf?.glow,
                          borderColor: conf?.border,
                        }}
                      >
                        {sheet.subject}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold font-display text-white">
                        {sheet.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-[#8A8A99]">Pre-Interview Contrast</span>
                  </div>

                  <p className="text-xs text-[#8A8A99] font-mono leading-relaxed">
                    {sheet.summary}
                  </p>

                  {/* Responsive Contrast Table */}
                  {table && table.columns && table.rows && (
                    <div className="rounded-xl overflow-x-auto border border-white/10 bg-[#08080C]">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="bg-white/[0.04] border-b border-white/10 text-[#8A8A99] uppercase text-[10px] tracking-wider">
                            {table.columns.map((col, cIdx) => (
                              <th key={cIdx} className="p-3 font-semibold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`p-3 leading-relaxed ${
                                    cIdx === 0 ? 'text-white font-medium' : 'text-[#EDEDF2]/85'
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Key Mental Model Rules */}
                  {rules.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs font-mono space-y-1.5">
                      <div className="text-purple-300 font-bold flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>60-Second Mental Model Rules:</span>
                      </div>
                      <ul className="space-y-1 text-[#8A8A99]">
                        {rules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400">›</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CARD DETAIL / PREVIEW MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[85vh] bg-[#0E0E14] border border-white/10 rounded-2xl p-6 overflow-y-auto space-y-5 shadow-2xl relative"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border"
                      style={{
                        color: SUBJECT_CONFIG[previewCard.subject]?.color,
                        backgroundColor: SUBJECT_CONFIG[previewCard.subject]?.glow,
                        borderColor: SUBJECT_CONFIG[previewCard.subject]?.border,
                      }}
                    >
                      {previewCard.subject}
                    </span>
                    <span className="text-xs font-mono text-[#8A8A99]">{previewCard.subtopic}</span>
                    <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      {previewCard.interview_frequency}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    {previewCard.title}
                  </h3>
                </div>

                <button
                  onClick={() => setPreviewCard(null)}
                  className="p-1 rounded-lg text-[#8A8A99] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-[#EDEDF2] leading-relaxed">
                <strong className="text-white block mb-1 font-mono text-xs text-[#8A8A99]">Question:</strong>
                {previewCard.question}
              </div>

              {previewCard.key_takeaway && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Quick Recall Anchor: </strong>
                    {previewCard.key_takeaway}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <strong className="text-xs font-mono text-[#8A8A99]">Detailed Explanation:</strong>
                <div className="text-xs sm:text-sm text-[#EDEDF2]/90 leading-relaxed whitespace-pre-line font-normal">
                  {previewCard.answer_markdown}
                </div>
              </div>

              {previewCard.code_snippet && (
                <div className="rounded-xl overflow-hidden bg-[#08080C] border border-white/10">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/5 text-[10px] font-mono text-[#8A8A99]">
                    <span className="text-cyan-400 uppercase">{previewCard.code_language || 'code'}</span>
                    <button
                      onClick={() => handleCopyCode(previewCard.code_snippet)}
                      className="hover:text-white cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-[#EDEDF2]">
                    <code>{previewCard.code_snippet}</code>
                  </pre>
                </div>
              )}

              {previewCard.diagram_ascii && (
                <div className="p-4 rounded-xl bg-[#08080C] border border-white/10 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre">
                  {previewCard.diagram_ascii}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CUSTOM CARD CREATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl max-h-[85vh] bg-[#0E0E14] border border-white/10 rounded-2xl p-6 overflow-y-auto space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-bold font-mono text-white">Create Custom Flashcard</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#8A8A99] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8A8A99] block mb-1">Subject</label>
                    <select
                      value={customForm.subject}
                      onChange={(e) => setCustomForm({ ...customForm, subject: e.target.value })}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="OS">Operating Systems (OS)</option>
                      <option value="DBMS">DBMS & SQL</option>
                      <option value="CN">Computer Networks (CN)</option>
                      <option value="System Design">System Design</option>
                      <option value="OOPs">OOPs & LLD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#8A8A99] block mb-1">Subtopic</label>
                    <input
                      type="text"
                      placeholder="e.g. Virtual Memory"
                      value={customForm.subtopic}
                      onChange={(e) => setCustomForm({ ...customForm, subtopic: e.target.value })}
                      required
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#8A8A99] block mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. How does Paging solve external fragmentation?"
                    value={customForm.title}
                    onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                    required
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-[#8A8A99] block mb-1">Question Prompt</label>
                  <textarea
                    rows={2}
                    placeholder="Write the full question scenario..."
                    value={customForm.question}
                    onChange={(e) => setCustomForm({ ...customForm, question: e.target.value })}
                    required
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#8A8A99] block mb-1">Answer & Explanation</label>
                  <textarea
                    rows={4}
                    placeholder="Comprehensive explanation, bullet points, mechanisms..."
                    value={customForm.answer_markdown}
                    onChange={(e) => setCustomForm({ ...customForm, answer_markdown: e.target.value })}
                    required
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#8A8A99] block mb-1">1-Sentence Quick Recall Anchor</label>
                  <input
                    type="text"
                    placeholder="Crucial takeaway sentence..."
                    value={customForm.key_takeaway}
                    onChange={(e) => setCustomForm({ ...customForm, key_takeaway: e.target.value })}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#8A8A99] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCard}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500 text-white hover:bg-purple-600 transition-colors cursor-pointer"
                  >
                    {isSubmittingCard ? 'Saving...' : 'Add to Active Recall'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
