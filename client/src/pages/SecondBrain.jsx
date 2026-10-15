import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import CalendarHeader from '../components/secondbrain/CalendarHeader'
import FilterDrawer from '../components/secondbrain/FilterDrawer'
import MonthView from '../components/secondbrain/MonthView'
import WeekView from '../components/secondbrain/WeekView'
import AgendaView from '../components/secondbrain/AgendaView'
import DayView from '../components/secondbrain/DayView'
import GoalsAndProjectsPanel from '../components/secondbrain/GoalsAndProjectsPanel'
import EventDetailModal from '../components/secondbrain/EventDetailModal'
import DsaWorkspace from '../components/dsa/DsaWorkspace'
import { Calendar, RefreshCw, AlertCircle, Flame, HelpCircle, X, ShieldCheck, Target, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAdmin } from '../context/AdminContext'
import { API_BASE_URL } from '../utils/apiConfig'

export default function SecondBrain({ defaultMode = 'calendar' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isDsaRoute = location.pathname.includes('/dsa') || defaultMode === 'dsa'
  const [brainMode, setBrainMode] = useState(isDsaRoute ? 'dsa' : 'calendar')
  const [showInfoModal, setShowInfoModal] = useState(false)

  useEffect(() => {
    if (location.pathname.includes('/dsa')) {
      setBrainMode('dsa')
    }
  }, [location.pathname])

  const { isAdmin, authFetch, contentVersion } = useAdmin()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [view, setView] = useState('month') // 'month' | 'week' | 'agenda' | 'day'
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({})
  const [goals, setGoals] = useState([])
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null)

  const apiUrl = API_BASE_URL

  // Fetch events with server-side filters
  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      if (selectedStatus !== 'All') params.append('status', selectedStatus)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const endpoint = isAdmin
        ? `${apiUrl}/api/v1/admin/events?${params.toString()}`
        : `${apiUrl}/api/v1/second-brain/events?${params.toString()}`

      const res = await (isAdmin ? authFetch(endpoint) : fetch(endpoint, { signal: AbortSignal.timeout(10000) }))
      if (res.ok) {
        const json = await res.json()
        const eventList = json.data || json.events
        if (json.success && Array.isArray(eventList)) {
          setEvents(eventList)
          setStatus('ready')
          return
        }
      }
      throw new Error('Failed to load events')
    } catch (err) {
      console.warn('Events fetch warning:', err)
      // If error occurs, keep existing events if available or set error state
      if (events.length === 0) {
        setStatus('error')
        setErrorMessage('Unable to connect to Second Brain service. Please ensure server is running.')
      }
    }
  }, [apiUrl, selectedCategory, selectedStatus, searchQuery, isAdmin, authFetch, events.length])

  // Fetch stats, goals, and projects
  const fetchMetadata = useCallback(async () => {
    try {
      const [statsRes, goalsRes, projRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/second-brain/statistics`, { signal: AbortSignal.timeout(8000) }),
        fetch(`${apiUrl}/api/v1/second-brain/goals`, { signal: AbortSignal.timeout(8000) }),
        fetch(`${apiUrl}/api/v1/second-brain/projects`, { signal: AbortSignal.timeout(8000) }),
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsJson = await statsRes.value.json()
        if (statsJson.success) setStats(statsJson.stats)
      }

      if (goalsRes.status === 'fulfilled' && goalsRes.value.ok) {
        const goalsJson = await goalsRes.value.json()
        if (goalsJson.success) setGoals(goalsJson.goals)
      }

      if (projRes.status === 'fulfilled' && projRes.value.ok) {
        const projJson = await projRes.value.json()
        if (projJson.success) setProjects(projJson.projects)
      }
    } catch (err) {
      console.warn('Metadata fetch error:', err)
    }
  }, [apiUrl])

  // Initial load
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    fetchMetadata()
  }, [fetchMetadata])

  // Re-fetch on contentVersion change
  useEffect(() => {
    if (contentVersion > 0) {
      fetchEvents()
      fetchMetadata()
    }
  }, [contentVersion, fetchEvents, fetchMetadata])

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (view === 'month' || view === 'agenda') {
        next.setMonth(next.getMonth() - 1)
      } else if (view === 'week') {
        next.setDate(next.getDate() - 7)
      } else if (view === 'day') {
        next.setDate(next.getDate() - 1)
      }
      return next
    })
  }

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (view === 'month' || view === 'agenda') {
        next.setMonth(next.getMonth() + 1)
      } else if (view === 'week') {
        next.setDate(next.getDate() + 7)
      } else if (view === 'day') {
        next.setDate(next.getDate() + 1)
      }
      return next
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleSelectDate = (date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleResetFilters = () => {
    setSelectedCategory('All')
    setSelectedStatus('All')
    setSearchQuery('')
  }

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedStatus !== 'All' ? 1 : 0)

  return (
    <main
      className="min-h-screen w-full pt-28 pb-20 px-4 sm:px-8 md:px-12 select-none"
      style={{ background: '#08080C' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Workspace Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 sm:p-2.5 rounded-2xl border border-hairline bg-[#0E0E14] shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setBrainMode('calendar')
                navigate('/calendar')
              }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                brainMode === 'calendar'
                  ? 'bg-white/10 text-white border border-white/20 shadow-md'
                  : 'text-muted hover:text-white border border-transparent hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-accent" />
              <span>Calendar & Planning</span>
            </button>

            <button
              onClick={() => {
                setBrainMode('dsa')
                navigate('/calendar/dsa')
              }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                brainMode === 'dsa'
                  ? 'bg-accent text-[#08080C] font-bold shadow-lg shadow-accent/20'
                  : 'text-muted hover:text-white border border-transparent hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>⚔️ DSA Training Arena</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-muted pr-2">
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Personal Second Brain</span>
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="hidden md:inline text-[#A0A0B0]">{brainMode === 'dsa' ? 'Interview Practice Mode' : 'Productivity Command Center'}</span>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 border border-hairline"
              title="Second Brain System Info"
            >
              <HelpCircle className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-mono">Info</span>
            </button>
          </div>
        </div>

        {/* DSA Training Arena Workspace */}
        {brainMode === 'dsa' ? (
          <DsaWorkspace
            onSwitchToCalendar={() => {
              setBrainMode('calendar')
              navigate('/calendar')
            }}
          />
        ) : (
          <div className="flex flex-col gap-10">
            {/* Header */}
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onViewChange={setView}
              onPrev={handlePrev}
              onNext={handleNext}
              onToday={handleToday}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
              activeFilterCount={activeFilterCount}
            />

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterOpen}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onResetFilters={handleResetFilters}
          resultCount={events.length}
        />

        {/* Error State with Retry */}
        {status === 'error' && (
          <div className="w-full py-12 px-6 rounded-2xl border border-hairline bg-[#160E0E]/40 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <h3 className="text-base font-display font-semibold text-white">Connection Error</h3>
            <p className="text-xs font-mono text-muted max-w-md">
              {errorMessage || 'Unable to fetch public records from Second Brain backend.'}
            </p>
            <button
              onClick={() => {
                setStatus('loading')
                fetchEvents()
                fetchMetadata()
              }}
              className="mt-2 px-4 py-2 rounded-full text-xs font-mono font-medium bg-accent text-[#08080C] hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <div className="w-full py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-muted">
              Loading public activities & calendar...
            </span>
          </div>
        )}

        {/* Active View Container */}
        {status === 'ready' && (
          <div className="w-full flex flex-col gap-10">
            <AnimatePresence mode="wait">
              {view === 'month' && (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <MonthView
                    currentDate={currentDate}
                    events={events}
                    onSelectEvent={setSelectedEvent}
                    onSelectDate={handleSelectDate}
                  />
                </motion.div>
              )}

              {view === 'week' && (
                <motion.div
                  key="week"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <WeekView
                    currentDate={currentDate}
                    events={events}
                    onSelectEvent={setSelectedEvent}
                    onSelectDate={handleSelectDate}
                  />
                </motion.div>
              )}

              {view === 'agenda' && (
                <motion.div
                  key="agenda"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AgendaView
                    events={events}
                    onSelectEvent={setSelectedEvent}
                  />
                </motion.div>
              )}

              {view === 'day' && (
                <motion.div
                  key="day"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DayView
                    currentDate={currentDate}
                    events={events}
                    onSelectEvent={setSelectedEvent}
                    onPrevDay={handlePrev}
                    onNextDay={handleNext}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Strategic Goals & Connected Projects Section */}
            <GoalsAndProjectsPanel goals={goals} projects={projects} />
          </div>
        )}
      </div>
    )}

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />

        {/* System Info Modal */}
        <AnimatePresence>
          {showInfoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInfoModal(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative z-10 w-full max-w-lg rounded-3xl border border-hairline bg-[#0E0E14] p-6 sm:p-8 flex flex-col gap-6 text-left shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-accent/15 text-accent">
                      <HelpCircle className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-display font-bold text-white">
                        Second Brain Guide
                      </h3>
                      <p className="text-xs font-mono text-muted">
                        Architecture & Workflow Principles
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 text-xs font-mono leading-relaxed text-muted">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-hairline flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-semibold block mb-0.5">Privacy Shielding</span>
                      Private calendar events, personal reflection logs, and confidential notes are strictly shielded server-side from public API inspection.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-hairline flex items-start gap-3">
                    <Target className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-semibold block mb-0.5">Strategic Goals & Linked Progress</span>
                      High-level milestones connect directly to scheduled execution events. Completing milestones updates progress bars in real-time.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-hairline flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-semibold block mb-0.5">Heatmap Proof of Work</span>
                      Eligible public tasks and deep work sessions automatically flow into your verified interactive Github-style activity heatmap.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
