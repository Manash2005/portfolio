import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'

export default function AdminToolbar() {
  const {
    isAdmin,
    adminUser,
    isEditMode,
    toggleEditMode,
    logout,
    openCreateProject,
    openCreateEvent,
    openCreateGoal,
    openEditAbout,
  } = useAdmin()

  const [isMinimized, setIsMinimized] = useState(false)

  if (!isAdmin) return null

  return (
    <aside aria-label="Admin Controls" className="fixed bottom-6 right-6 z-50 flex items-center">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full cursor-pointer transition-all shadow-xl"
            style={{
              background: 'rgba(15, 17, 26, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(184, 255, 60, 0.3)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ background: '#B8FF3C' }}
            />
            <span style={{ color: '#B8FF3C', fontWeight: 600 }}>ADMIN</span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-2.5 p-2 px-3 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(12, 14, 20, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(184, 255, 60, 0.08)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
            }}
          >
            {/* Admin identity indicator */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#B8FF3C' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#B8FF3C' }} />
              </span>
              <span style={{ color: '#B8FF3C', fontWeight: 600, letterSpacing: '0.06em' }}>
                ADMIN
              </span>
              <span style={{ color: 'var(--color-muted)' }}>
                ({adminUser?.username || 'manash'})
              </span>
            </div>

            {/* Edit Mode Toggle */}
            <button
              onClick={toggleEditMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              style={{
                background: isEditMode ? 'rgba(184, 255, 60, 0.15)' : 'rgba(255,255,255,0.05)',
                border: isEditMode ? '1px solid rgba(184, 255, 60, 0.4)' : '1px solid transparent',
                color: isEditMode ? '#B8FF3C' : 'var(--color-muted)',
              }}
              title="Toggle in-place visual edit triggers"
            >
              <span>Edit Mode:</span>
              <span style={{ fontWeight: 600 }}>{isEditMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 border-l border-r border-white/10 px-2">
              <Link
                to="/second-brain"
                className="px-2 py-1 rounded hover:bg-white/10 transition-colors text-[#B8FF3C] flex items-center gap-1"
                title="Go to Second Brain & DSA practice arena"
              >
                <span>Brain ↗</span>
              </Link>
              <button
                onClick={openCreateProject}
                className="px-2 py-1 rounded hover:bg-white/10 transition-colors text-white cursor-pointer"
                title="Create a new portfolio project"
              >
                + Project
              </button>
              <button
                onClick={openCreateEvent}
                className="px-2 py-1 rounded hover:bg-white/10 transition-colors text-white cursor-pointer"
                title="Create calendar event or activity note"
              >
                + Event
              </button>
              <button
                onClick={openEditAbout}
                className="px-2 py-1 rounded hover:bg-white/10 transition-colors text-white cursor-pointer"
                title="Edit bio, headline, and current status"
              >
                Edit Bio
              </button>
            </div>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded hover:bg-white/10 text-muted transition-colors cursor-pointer"
              title="Minimize toolbar"
            >
              –
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="px-2.5 py-1 rounded hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
              title="Logout and lock portfolio"
            >
              Exit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
