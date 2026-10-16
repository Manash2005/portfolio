import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const VIEWS = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'day', label: 'Day' },
]

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  searchQuery,
  onSearchChange,
  onToggleFilters,
  activeFilterCount = 0,
}) {
  const formatPeriodTitle = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
    if (view === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' })
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' })
      const year = endOfWeek.getFullYear()

      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${year}`
      }
      return `${startMonth} ${startOfWeek.getDate()} – ${endMonth} ${endOfWeek.getDate()}, ${year}`
    }
    // Month or Agenda
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <header className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-hairline/60">
      {/* Left: Product Title and Period Navigator */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>Second Brain</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-accent/40 bg-accent/10 text-accent font-normal align-middle">
              Calendar
            </span>
          </h1>
          <p className="text-xs font-mono text-muted mt-0.5">
            Curated roadmap, learning sessions, milestones & technical logs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0E0E14] border border-hairline rounded-xl p-1 mt-1 sm:mt-0">
          {/* Prev */}
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Previous period"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Today */}
          <button
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Today
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Next period"
            aria-label="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-hairline mx-1" aria-hidden />

          {/* Period Title */}
          <span
            className="px-2 text-xs sm:text-sm font-mono font-semibold text-accent select-none"
            style={{ minWidth: '140px' }}
          >
            {formatPeriodTitle()}
          </span>
        </div>
      </div>

      {/* Right: Search, Filter Toggle, and View Switcher */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[160px] sm:min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search logs..."
            className="w-full bg-[#0E0E14] border border-hairline rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder:text-muted/60 focus:outline-none focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
            activeFilterCount > 0
              ? 'border-accent bg-accent/15 text-accent font-semibold'
              : 'border-hairline bg-[#0E0E14] text-muted hover:text-white hover:border-white/20'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-accent text-[#08080C] text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Switcher: Month / Week / Agenda / Day */}
        <div className="flex items-center p-1 rounded-xl border border-hairline bg-[#0E0E14]">
          {VIEWS.map((v) => {
            const isSelected = view === v.id
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-[#08080C] font-semibold shadow-sm'
                    : 'text-muted hover:text-white'
                }`}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
