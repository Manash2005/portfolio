import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import CalendarHeader from '../components/secondbrain/CalendarHeader'
import FilterDrawer from '../components/secondbrain/FilterDrawer'
import ActivityStatsBar from '../components/secondbrain/ActivityStatsBar'
import MonthView from '../components/secondbrain/MonthView'
import WeekView from '../components/secondbrain/WeekView'
import AgendaView from '../components/secondbrain/AgendaView'
import DayView from '../components/secondbrain/DayView'
import GoalsAndProjectsPanel from '../components/secondbrain/GoalsAndProjectsPanel'
import EventDetailModal from '../components/secondbrain/EventDetailModal'
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react'

export default function SecondBrain() {
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

  const apiUrl = import.meta.env.VITE_API_URL || 'https://portfolio-c43c.onrender.com'

  // Fetch events with server-side filters
  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      if (selectedStatus !== 'All') params.append('status', selectedStatus)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const res = await fetch(`${apiUrl}/api/v1/second-brain/events?${params.toString()}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.events)) {
          setEvents(json.events)
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
  }, [apiUrl, selectedCategory, selectedStatus, searchQuery, events.length])

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

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    fetchMetadata()
  }, [fetchMetadata])

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

        {/* Stats Bar */}
        <ActivityStatsBar stats={stats} />

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

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </main>
  )
}
