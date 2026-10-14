import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Tag,
  Target,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Edit2,
} from 'lucide-react'
import { getEventColor } from '../../utils/activityStats'
import { useAdmin } from '../../context/AdminContext'

export default function EventDetailModal({ event, isOpen, onClose }) {
  const { isAdmin, isEditMode, openEditEvent } = useAdmin()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const eventColor = event.color || getEventColor(event)

  const formatDateTime = (isoStr) => {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: event.all_day ? undefined : '2-digit',
        minute: event.all_day ? undefined : '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  // Duration in hours/minutes
  const getDuration = () => {
    if (event.all_day) return 'All Day'
    if (!event.start_at || !event.end_at) return ''
    try {
      const start = new Date(event.start_at).getTime()
      const end = new Date(event.end_at).getTime()
      const diffMin = Math.round((end - start) / 60000)
      if (diffMin <= 0) return ''
      const hrs = Math.floor(diffMin / 60)
      const mins = diffMin % 60
      if (hrs === 0) return `${mins}m`
      if (mins === 0) return `${hrs}h`
      return `${hrs}h ${mins}m`
    } catch {
      return ''
    }
  }

  const durationStr = getDuration()

  const handleEditClick = () => {
    onClose()
    openEditEvent(event)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-2xl border border-hairline p-6 sm:p-7 shadow-2xl z-10 text-left overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(18, 18, 26, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%)',
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px ${eventColor}30`,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-title"
        >
          {/* Top category accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: eventColor }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges: Category, Status, Privacy */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Category Pill */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border"
              style={{
                backgroundColor: `${eventColor}15`,
                borderColor: `${eventColor}40`,
                color: eventColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: eventColor }}
              />
              {event.category}
            </span>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                event.status === 'Completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : event.status === 'In Progress'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : event.status === 'Cancelled'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {event.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
              {event.status === 'Cancelled' && <AlertCircle className="w-3 h-3" />}
              {event.status === 'Planned' && <Clock className="w-3 h-3" />}
              <span>{event.status}</span>
            </span>

            {/* Privacy Badge */}
            {event.visibility === 'Private' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-purple-500/40 bg-purple-500/10 text-purple-300">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </span>
            )}

            {/* Heatmap Badge */}
            {Boolean(event.show_on_portfolio_heatmap) && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#B8FF3C]/40 bg-[#B8FF3C]/10 text-[#B8FF3C]">
                Heatmap Active
              </span>
            )}

            {/* Priority */}
            {event.priority && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-white/10 text-muted">
                {event.priority}
              </span>
            )}
          </div>

          {/* Title and Admin Edit Button */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3
              id="event-title"
              className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {event.title}
            </h3>

            {isAdmin && isEditMode && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer hover:bg-[#B8FF3C]/20 shrink-0"
                style={{
                  background: 'rgba(184, 255, 60, 0.1)',
                  borderColor: 'rgba(184, 255, 60, 0.4)',
                  color: '#B8FF3C',
                }}
                title="Edit this event"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm font-sans text-white/80 leading-relaxed mb-5">
              {event.description}
            </p>
          )}

          {/* Timing details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-hairline bg-white/[0.02] mb-5 text-xs font-mono">
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>{formatDateTime(event.start_at)}</span>
            </div>
            {durationStr && (
              <div className="flex items-center gap-2 text-muted">
                <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Duration: <strong className="text-white">{durationStr}</strong></span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-muted sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Private Notes Section (Strictly when available to authenticated admin) */}
          {event.private_notes && (
            <div className="p-3.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 mb-5">
              <div className="flex items-center gap-1.5 text-yellow-400 font-mono text-xs font-semibold mb-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Confidential Private Notes (Admin Only)</span>
              </div>
              <p className="text-xs font-sans text-yellow-200/90 leading-relaxed whitespace-pre-wrap">
                {event.private_notes}
              </p>
            </div>
          )}

          {/* Relationships: Goal & Project */}
          {(event.goal_title || event.project_title) && (
            <div className="flex flex-col gap-2 mb-5">
              {event.goal_title && (
                <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg border border-hairline bg-white/[0.01]">
                  <Target className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-muted">Goal:</span>
                  <span className="text-white font-medium">{event.goal_title}</span>
                </div>
              )}
              {event.project_title && (
                <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg border border-hairline bg-white/[0.01]">
                  <FolderGit2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-muted">Project:</span>
                  <span className="text-white font-medium">{event.project_title}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              <Tag className="w-3 h-3 text-muted mr-1" />
              {event.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono border border-white/10 bg-white/5 text-white/70"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* External links */}
          {event.external_url && (
            <div className="pt-3 border-t border-hairline flex items-center justify-between">
              <a
                href={event.external_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: eventColor,
                  color: '#08080C',
                }}
              >
                <span>External Resource</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <span className="text-[11px] font-mono text-muted/60">
                {event.visibility === 'Private' ? 'Protected Record' : 'Public Record'}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
