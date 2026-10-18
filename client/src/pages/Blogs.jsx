import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/apiConfig'
import { useAdmin } from '../context/AdminContext'
import { BookOpen, Sparkles, Plus, Search, ExternalLink, Trash2, Clock, Tag } from 'lucide-react'

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

const TOPIC_COLORS = {
  'Distributed Systems': { text: '#00F0FF', bg: 'rgba(0, 240, 255, 0.1)', border: 'rgba(0, 240, 255, 0.3)' },
  'AI & Machine Learning': { text: '#C084FC', bg: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.3)' },
  'System Design': { text: '#B8FF3C', bg: 'rgba(184, 255, 60, 0.1)', border: 'rgba(184, 255, 60, 0.3)' },
  'Databases & Storage': { text: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
  'Backend Architecture': { text: '#FFB800', bg: 'rgba(255, 184, 0, 0.1)', border: 'rgba(255, 184, 0, 0.3)' },
  'Frontend & Web': { text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.3)' },
  'DevOps & Cloud': { text: '#F43F5E', bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)' },
  'Algorithms & DSA': { text: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' },
}

export default function Blogs({ embedded = false, onSelectBlog }) {
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
        setError(data.error || 'Failed to load articles')
      }
    } catch {
      setError('Network error connecting to blogs service.')
    } finally {
      setIsLoading(false)
    }
  }

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
      // fallback to default
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [selectedTopic, selectedSubtopic, searchQuery])

  // Handle article import with live step feedback
  const handleImport = async (e) => {
    e.preventDefault()
    if (!importUrl.trim()) return

    setIsSubmitting(true)
    setImportError('')
    setImportStep(1)

    const stepTimer1 = setTimeout(() => setImportStep(2), 2000)
    const stepTimer2 = setTimeout(() => setImportStep(3), 5000)

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

        if (onSelectBlog) {
          onSelectBlog(data.blog.slug)
        } else {
          navigate(embedded ? `/calendar/blogs/${data.blog.slug}` : `/second-brain/blogs/${data.blog.slug}`)
        }
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

  const handleCardClick = (slug) => {
    if (onSelectBlog) {
      onSelectBlog(slug)
    } else {
      navigate(embedded ? `/calendar/blogs/${slug}` : `/second-brain/blogs/${slug}`)
    }
  }

  return (
    <div className={`w-full text-[#EDEDF2] ${embedded ? 'pt-2 pb-12' : 'pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'}`}>
      {/* Top Breadcrumb when not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/second-brain"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8A8A99] hover:text-[#B8FF3C] transition-colors"
          >
            <span>←</span> Second Brain
          </Link>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0E0E14] via-[#12121c] to-[#0E0E14] border border-white/10 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase mb-2 bg-white/[0.04] border border-white/10 text-cyan-400">
            <BookOpen className="w-3 h-3 text-cyan-400" />
            <span>Curated Knowledge Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Engineering Architecture Deep Dives
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8A99] max-w-2xl mt-1">
            Verbatim articles scraped with strict author preservation, structured with AI topic clusters, architectural diagrams, and interactive checkpoints.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setIsImportModalOpen(true)
              setImportError('')
              setImportStep(0)
            }}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.15)] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Curate New Article</span>
          </button>
        )}
      </div>

      {/* Search & Topic Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#8A8A99] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, author, tags..."
            className="w-full bg-[#0E0E14] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-[#8A8A99] focus:outline-none focus:border-cyan-400/50 transition-colors"
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

        {/* Selected subtopic filter badge if active */}
        {selectedSubtopic && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8A8A99]">Filtering by tag:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
              #{selectedSubtopic}
              <button
                onClick={() => setSelectedSubtopic('')}
                className="hover:text-white text-xs"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Topic Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {topics.map(t => {
          const isSelected = selectedTopic === t
          const colorMeta = TOPIC_COLORS[t] || { text: '#B8FF3C', bg: 'rgba(184, 255, 60, 0.1)', border: 'rgba(184, 255, 60, 0.3)' }
          return (
            <button
              key={t}
              onClick={() => {
                setSelectedTopic(t)
                setSelectedSubtopic('')
              }}
              style={isSelected ? {
                backgroundColor: colorMeta.text,
                color: '#08080C',
                borderColor: colorMeta.text,
                boxShadow: `0 0 16px ${colorMeta.border}`,
              } : {}}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'font-bold'
                  : 'bg-[#0E0E14] text-[#8A8A99] border border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Content State: Loading, Error, Empty, or Cards Grid */}
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
        <div className="py-20 text-center rounded-2xl bg-[#0E0E14]/60 border border-white/5 p-8">
          <BookOpen className="w-10 h-10 text-cyan-400/40 mx-auto mb-3" />
          <h3 className="text-sm font-mono font-bold text-white mb-1">No articles in this category yet</h3>
          <p className="text-xs text-[#8A8A99] max-w-sm mx-auto mb-6">
            Curate technical deep dives from Medium, Substack, Netflix Tech Blog, or company engineering publications.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-mono bg-cyan-400 text-[#08080C] font-semibold hover:bg-cyan-300 transition-all cursor-pointer shadow-lg shadow-cyan-400/20"
            >
              Curate first article with AI
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => {
            const colorMeta = TOPIC_COLORS[b.topic] || { text: '#B8FF3C', bg: 'rgba(184, 255, 60, 0.1)', border: 'rgba(184, 255, 60, 0.3)' }

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="group relative flex flex-col justify-between rounded-2xl bg-[#0E0E14] border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl"
                style={{
                  borderTop: `2px solid ${colorMeta.text}55`,
                }}
              >
                {/* Visual Header / Cover Image */}
                <div
                  onClick={() => handleCardClick(b.slug)}
                  className="block relative h-44 w-full overflow-hidden bg-black/50 cursor-pointer"
                >
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
                    /* Cybernetic Geometric Pattern Fallback (Never low-res avatar) */
                    <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-[#12121e] to-[#0A0A10] border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/40">TECH_SPEC_NODE</span>
                        <span className="w-2 h-2 rounded-full" style={{ background: colorMeta.text }} />
                      </div>
                      <div className="opacity-25 font-mono text-2xl font-black tracking-widest" style={{ color: colorMeta.text }}>
                        {b.topic.toUpperCase().replace(/\s+/g, '_')}
                      </div>
                      <div className="text-[10px] font-mono text-white/30 truncate">
                        {b.original_author || 'Engineering Spec'}
                      </div>
                    </div>
                  )}

                  {/* Badges Over Image */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold backdrop-blur-md border"
                      style={{
                        color: colorMeta.text,
                        backgroundColor: 'rgba(8, 8, 12, 0.85)',
                        borderColor: colorMeta.border,
                      }}
                    >
                      {b.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/80 bg-[#08080C]/85 backdrop-blur-md border border-white/10 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-white/60" />
                      {b.reading_time_minutes}m
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A8A99] mb-2">
                      <span className="truncate max-w-[150px]">{b.original_author || 'Engineering Team'}</span>
                      <span>•</span>
                      <span>{b.published_date || 'Curated'}</span>
                    </div>

                    <div
                      onClick={() => handleCardClick(b.slug)}
                      className="cursor-pointer group-hover:text-cyan-400 transition-colors"
                    >
                      <h3 className="text-base font-bold tracking-tight text-white line-clamp-2 mb-2 leading-snug font-display">
                        {b.title}
                      </h3>
                    </div>

                    <p className="text-xs text-[#8A8A99] line-clamp-3 leading-relaxed mb-4">
                      {b.summary}
                    </p>
                  </div>

                  {/* Subtopics Tags & Actions */}
                  <div>
                    {b.subtopics && b.subtopics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {b.subtopics.slice(0, 3).map((sub, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedSubtopic(sub)}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] hover:bg-cyan-400/10 hover:text-cyan-400 text-[#8A8A99] border border-white/5 transition-colors cursor-pointer"
                          >
                            #{sub}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => handleCardClick(b.slug)}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium"
                      >
                        Read Deep Dive <span>→</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(b.id, b.title)}
                          disabled={deletingId === b.id}
                          className="text-red-400/50 hover:text-red-400 transition-colors cursor-pointer p-1"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Admin Curate Modal */}
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
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
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
                Paste any external engineering article URL (Medium, Substack, Netflix Tech Blog, etc.). The AI will scrape and preserve verbatim author text, filter out low-res avatars/icons, analyze topic clusters, and format into your template.
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
                    className="w-full bg-[#08080C] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-[#8A8A99]/50 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>

                {importError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    {importError}
                  </div>
                )}

                {isSubmitting && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                      <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>
                        {importStep === 1 && '1/3 Scraping article & preserving verbatim author content...'}
                        {importStep === 2 && '2/3 AI analyzing topic clusters & key takeaways...'}
                        {importStep === 3 && '3/3 Structuring template & persisting to cloud DB...'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-700"
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
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-400 text-[#08080C] hover:bg-cyan-300 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-400/20"
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
