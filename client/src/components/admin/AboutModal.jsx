import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAdmin } from '../../context/AdminContext'

export default function AboutModal() {
  const { isAboutModalOpen, closeAboutModal, authFetch, triggerRefresh } = useAdmin()

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'now' | 'contact'
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [personal, setPersonal] = useState({
    name: 'Manash Swain',
    role: 'AI Automation & Full-Stack Engineer',
    location: 'Bangalore, India',
    headline: 'I build web apps and AI agents you can trust.',
    sub: 'Full-Stack & AI Automation · BITS Pilani CS · Bangalore',
    aboutText: '',
    now: {
      building: '',
      learning: '',
      openTo: '',
    },
  })

  const [contact, setContact] = useState({
    email: '',
    github: '',
    linkedin: '',
    resume_url: '',
  })

  useEffect(() => {
    if (!isAboutModalOpen) return

    setFetching(true)
    setError(null)
    setSuccess(null)

    authFetch('/api/portfolio/content')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          const p = json.data.personal || {}
          setPersonal({
            name: p.name || 'Manash Swain',
            role: p.role || '',
            location: p.location || '',
            headline: p.headline || '',
            sub: p.sub || '',
            aboutText: Array.isArray(p.about) ? p.about.join('\n\n') : (p.about || ''),
            now: {
              building: p.now?.building || '',
              learning: p.now?.learning || '',
              openTo: p.now?.openTo || '',
            },
          })
          const c = json.data.contact || {}
          setContact({
            email: c.email || '',
            github: c.github || '',
            linkedin: c.linkedin || '',
            resume_url: c.resume_url || '',
          })
        }
      })
      .catch(err => {
        setError('Failed to load portfolio content: ' + err.message)
      })
      .finally(() => setFetching(false))
  }, [isAboutModalOpen, authFetch])

  if (!isAboutModalOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const aboutParagraphs = personal.aboutText
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)

    const personalPayload = {
      name: personal.name,
      role: personal.role,
      location: personal.location,
      headline: personal.headline,
      sub: personal.sub,
      about: aboutParagraphs,
      now: personal.now,
    }

    try {
      // 1. Update personal section
      const resP = await authFetch('/api/v1/admin/content/personal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalPayload),
      })
      const jsonP = await resP.json()
      if (!resP.ok || !jsonP.success) {
        throw new Error(jsonP.error || 'Failed to update personal content')
      }

      // 2. Update contact section
      const resC = await authFetch('/api/v1/admin/content/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      })
      const jsonC = await resC.json()
      if (!resC.ok || !jsonC.success) {
        throw new Error(jsonC.error || 'Failed to update contact content')
      }

      setSuccess('Profile & site content updated successfully!')
      triggerRefresh()
      setTimeout(() => {
        closeAboutModal()
      }, 700)
    } catch (err) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAboutModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 md:p-8 z-10 my-auto shadow-2xl"
        style={{
          background: '#0D0F17',
          borderColor: 'var(--color-hairline)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#B8FF3C' }} />
              <span className="text-[0.68rem] tracking-wider text-muted">PORTFOLIO CUSTOMIZATION</span>
            </div>
            <h2 className="text-xl text-white font-sans font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              Edit Profile, Bio & Site Info
            </h2>
          </div>
          <button
            onClick={closeAboutModal}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: activeTab === 'profile' ? 'rgba(184, 255, 60, 0.15)' : 'transparent',
              color: activeTab === 'profile' ? '#B8FF3C' : 'var(--color-muted)',
              border: activeTab === 'profile' ? '1px solid rgba(184, 255, 60, 0.3)' : '1px solid transparent',
            }}
          >
            Bio & Headline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('now')}
            className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: activeTab === 'now' ? 'rgba(184, 255, 60, 0.15)' : 'transparent',
              color: activeTab === 'now' ? '#B8FF3C' : 'var(--color-muted)',
              border: activeTab === 'now' ? '1px solid rgba(184, 255, 60, 0.3)' : '1px solid transparent',
            }}
          >
            "Now" Focus Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: activeTab === 'contact' ? 'rgba(184, 255, 60, 0.15)' : 'transparent',
              color: activeTab === 'contact' ? '#B8FF3C' : 'var(--color-muted)',
              border: activeTab === 'contact' ? '1px solid rgba(184, 255, 60, 0.3)' : '1px solid transparent',
            }}
          >
            Contact & Links
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 text-xs">
            {success}
          </div>
        )}

        {fetching ? (
          <div className="py-12 text-center text-muted text-xs">Loading current portfolio content...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {activeTab === 'profile' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">FULL NAME</label>
                    <input
                      type="text"
                      value={personal.name}
                      onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">PRIMARY ROLE</label>
                    <input
                      type="text"
                      value={personal.role}
                      onChange={e => setPersonal(p => ({ ...p, role: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">HERO HEADLINE</label>
                  <input
                    type="text"
                    value={personal.headline}
                    onChange={e => setPersonal(p => ({ ...p, headline: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">SUB-HEADLINE (Location, University, Focus)</label>
                  <input
                    type="text"
                    value={personal.sub}
                    onChange={e => setPersonal(p => ({ ...p, sub: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    ABOUT BIOGRAPHY (Separate paragraphs with double newline)
                  </label>
                  <textarea
                    rows={6}
                    value={personal.aboutText}
                    onChange={e => setPersonal(p => ({ ...p, aboutText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white font-sans text-sm leading-relaxed"
                  />
                </div>
              </>
            )}

            {activeTab === 'now' && (
              <>
                <div>
                  <label className="block text-zinc-400 mb-1">CURRENTLY BUILDING</label>
                  <input
                    type="text"
                    value={personal.now.building}
                    onChange={e => setPersonal(p => ({ ...p, now: { ...p.now, building: e.target.value } }))}
                    placeholder="AI agent systems that combine LLMs with deterministic control"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">CURRENTLY LEARNING</label>
                  <input
                    type="text"
                    value={personal.now.learning}
                    onChange={e => setPersonal(p => ({ ...p, now: { ...p.now, learning: e.target.value } }))}
                    placeholder="Agentic workflows, structured outputs, and tool-use patterns"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">CURRENTLY OPEN TO</label>
                  <input
                    type="text"
                    value={personal.now.openTo}
                    onChange={e => setPersonal(p => ({ ...p, now: { ...p.now, openTo: e.target.value } }))}
                    placeholder="AI Automation, Backend, or Full-Stack internships"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </>
            )}

            {activeTab === 'contact' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">RESUME URL / PATH</label>
                    <input
                      type="text"
                      value={contact.resume_url}
                      onChange={e => setContact(c => ({ ...c, resume_url: e.target.value }))}
                      placeholder="/resume.pdf or https://..."
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">GITHUB PROFILE URL</label>
                    <input
                      type="url"
                      value={contact.github}
                      onChange={e => setContact(c => ({ ...c, github: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">LINKEDIN PROFILE URL</label>
                    <input
                      type="url"
                      value={contact.linkedin}
                      onChange={e => setContact(c => ({ ...c, linkedin: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={closeAboutModal}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: loading ? 'rgba(184, 255, 60, 0.4)' : '#B8FF3C',
                  color: '#08080C',
                }}
              >
                {loading ? 'Saving...' : 'Save Site Content'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
