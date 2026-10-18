import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/apiConfig'
import { useAdmin } from '../context/AdminContext'

const DEFAULT_TOPICS = [
  'All',
  'System Design',
  'Distributed Systems',
  'AI & Machine Learning',
  'Backend Architecture',
  'Databases & Storage',
  'Frontend & Web',
  'DevOps & Cloud',
  'Algorithms & DSA',
]

export default function Blogs() {
  const navigate = useNavigate()
  const { isAdmin, authFetch } = useAdmin()

  const [blogs, setBlogs] = useState([])
  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [selectedSubtopic, setSelectedSubtopic] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Admin import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importStep, setImportStep] = useState(0) // 0: idle, 1: fetching, 2: analyzing, 3: saving
  const [importError, setImportError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Fetch blogs & topics
  const fetchBlogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedTopic !== 'All') params.append('topic', selectedTopic)
      if (selectedSubtopic) params.append('subtopic', selectedSubtopic)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const res = await fetch(`${API_BASE_URL}/api/v1/blogs?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setBlogs(data.blogs || [])
      } else {
        setError(data.error || 'Failed to load blogs')
      }
    } catch (err) {
      setError('Network error loading blogs. Please check server.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch topics list
  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/blogs/topics`)
      const data = await res.json()
      if (data.success && data.topics) {
        const customTopics = data.topics.map(t => t.name)
        const combined = Array.from(new Set(['All', ...DEFAULT_TOPICS.slice(1), ...customTopics]))
        setTopics(combined)
      }
    } catch {
      // use default topics
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [selectedTopic, selectedSubtopic, searchQuery])

  // Handle article import
  const handleImport = async (e) => {
    e.preventDefault()
    if (!importUrl.trim()) return

    setIsSubmitting(true)
    setImportError('')
    setImportStep(1)

    // Simulate step progression for responsive UX
    const stepTimer1 = setTimeout(() => setImportStep(2), 2200)
    const stepTimer2 = setTimeout(() => setImportStep(3), 5500)

    try {
      const res = await authFetch('/api/v1/blogs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      })

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)

      const data = await res.json()
      if (data.success && data.blog) {
        setImportUrl('')
        setIsImportModalOpen(false)
        setImportStep(0)
        await fetchBlogs()
        await fetchTopics()
        navigate(`/blogs/${data.blog.slug}`)
      } else {
        setImportError(data.error || 'Failed to curate article.')
        setImportStep(0)
      }
    } catch (err) {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      setImportError('Import failed: ' + (err.message || 'Check network connection'))
      setImportStep(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle article deletion (Admin only)
  const handleDelete = async (blogId, title) => {
    if (!window.confirm(`Delete curated article "${title}"? This cannot be undone.`)) return
    setDeletingId(blogId)
    try {
      const res = await authFetch(`/api/v1/blogs/${blogId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setBlogs(prev => prev.filter(b => b.id !== blogId))
      } else {
        alert(data.error || 'Failed to delete blog')
      }
    } catch (err) {
      alert('Delete error: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen text-[#EDEDF2] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#8A8A99] hover:text-[#B8FF3C] transition-colors"
        >
          <span>←</span> Back to Portfolio
        </Link>

        {isAdmin && (
          <button
            onClick={() => {
              setIsImportModalOpen(true)
              setImportError('')
              setImportStep(0)
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#B8FF3C]/10 text-[#B8FF3C] border border-[#B8FF3C]/30 hover:bg-[#B8FF3C]/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(184,255,60,0.15)]"
          >
            <span className="text-base leading-none">+</span> Curate New Article
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative mb-12 pb-8 border-b border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase mb-4 bg-white/[0.04] border border-white/10 text-[#B8FF3C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C] animate-pulse" />
          Engineered Deep Dives
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Curated Tech Architecture
        </h1>
        <p className="text-sm sm:text-base text-[#8A8A99] max-w-2xl leading-relaxed">
          High-signal software engineering and distributed systems articles scraped from across the web. Original author text preserved 100% verbatim, structured with AI topic segregation and architectural takeaways.
        </p>

        {/* Search Input */}
        <div className="mt-6 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, keyword, or author..."
            className="w-full bg-[#0E0E14] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-[#8A8A99] focus:outline-none focus:border-[#B8FF3C]/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8A8A99] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Topic Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {topics.map(t => {
          const isSelected = selectedTopic === t
          return (
            <button
              key={t}
              onClick={() => {
                setSelectedTopic(t)
                setSelectedSubtopic('')
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#B8FF3C] text-[#08080C] font-semibold shadow-[0_0_16px_rgba(184,255,60,0.3)]'
                  : 'bg-[#0E0E14] text-[#8A8A99] border border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Content State: Loading, Error, Empty, or Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-red-400 text-sm font-mono">
          {error}
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-white/[0.01] border border-white/5">
          <p className="text-[#8A8A99] font-mono text-sm mb-3">No articles curated in this category yet.</p>
          {isAdmin ? (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-mono bg-[#B8FF3C] text-[#08080C] font-semibold hover:bg-[#a6ec31] transition-all cursor-pointer"
            >
              Curate first article
            </button>
          ) : (
            <p className="text-xs text-[#8A8A99]/60">Check back soon for new engineering deep dives.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group relative flex flex-col justify-between rounded-2xl bg-[#0E0E14] border border-white/5 hover:border-[#B8FF3C]/40 transition-all duration-300 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(184,255,60,0.08)]"
            >
              {/* Cover Image or Tech Pattern */}
              <Link to={`/blogs/${b.slug}`} className="block relative h-48 w-full overflow-hidden bg-black/40">
                {b.cover_image ? (
                  <img
                    src={b.cover_image}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-b border-white/5">
                    <span className="text-3xl opacity-20 font-mono font-bold tracking-widest text-[#B8FF3C]">
                      TECH_DEEP_DIVE
                    </span>
                  </div>
                )}
                {/* Topic & Read Time Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#08080C]/80 backdrop-blur-md text-[#B8FF3C] border border-white/10">
                    {b.topic}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/70 bg-[#08080C]/80 backdrop-blur-md border border-white/5">
                    ⚡ {b.reading_time_minutes} min read
                  </span>
                </div>
              </Link>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A8A99] mb-2">
                    <span>{b.original_author || 'Engineering Team'}</span>
                    <span>•</span>
                    <span>{b.published_date || 'Recent'}</span>
                  </div>

                  <Link to={`/blogs/${b.slug}`} className="block group-hover:text-[#B8FF3C] transition-colors">
                    <h3 className="text-lg font-bold tracking-tight text-white line-clamp-2 mb-2 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                      {b.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-[#8A8A99] line-clamp-3 leading-relaxed mb-4">
                    {b.summary}
                  </p>
                </div>

                {/* Subtopic Tags & Footer */}
                <div>
                  {b.subtopics && b.subtopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {b.subtopics.slice(0, 3).map((sub, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSubtopic(sub)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] hover:bg-[#B8FF3C]/10 hover:text-[#B8FF3C] text-[#8A8A99] border border-white/5 transition-colors cursor-pointer"
                        >
                          #{sub}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <Link
                      to={`/blogs/${b.slug}`}
                      className="inline-flex items-center gap-1.5 text-[#B8FF3C] hover:underline"
                    >
                      Read Curated Article <span>→</span>
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(b.id, b.title)}
                        disabled={deletingId === b.id}
                        className="text-red-400/60 hover:text-red-400 text-[11px] transition-colors cursor-pointer"
                        title="Delete article"
                      >
                        {deletingId === b.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Admin Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-[#0E0E14] border border-white/10 p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B8FF3C]" />
                  <h3 className="text-base font-bold text-white font-mono">Curate Article with AI</h3>
                </div>
                {!isSubmitting && (
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="text-[#8A8A99] hover:text-white text-xs font-mono cursor-pointer"
                  >
                    ✕ Close
                  </button>
                )}
              </div>

              <p className="text-xs text-[#8A8A99] mb-4 leading-relaxed">
                Paste any external engineering article URL (e.g. Medium, Substack, Netflix Tech Blog, etc.). The AI will scrape and preserve the author's verbatim text and images, analyze topic clusters, and format into your template.
              </p>

              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#8A8A99] uppercase mb-1">
                    Article URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://netflixtechblog.com/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#08080C] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-[#8A8A99]/50 focus:outline-none focus:border-[#B8FF3C]/50"
                  />
                </div>

                {importError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    {importError}
                  </div>
                )}

                {isSubmitting && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#B8FF3C]">
                      <div className="w-3.5 h-3.5 border-2 border-[#B8FF3C] border-t-transparent rounded-full animate-spin" />
                      <span>
                        {importStep === 1 && '1/3 Scraping article & extracting verbatim text & images...'}
                        {importStep === 2 && '2/3 AI analyzing topic clusters & architecture takeaways...'}
                        {importStep === 3 && '3/3 Structuring template & persisting to cloud DB...'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B8FF3C] transition-all duration-700"
                        style={{ width: `${(importStep / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-[#8A8A99] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !importUrl.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-[#B8FF3C] text-[#08080C] hover:bg-[#a6ec31] transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(184,255,60,0.2)]"
                  >
                    {isSubmitting ? 'Curating Article...' : 'Start AI Curation'}
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
