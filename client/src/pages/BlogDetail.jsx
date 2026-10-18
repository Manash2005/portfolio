import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { API_BASE_URL } from '../utils/apiConfig'
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Share2,
  ZoomIn,
  ZoomOut,
  X,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Type,
  Maximize2,
  Check,
} from 'lucide-react'

const TOPIC_THEMES = {
  'Distributed Systems': { text: '#00F0FF', border: 'rgba(0, 240, 255, 0.3)', glow: 'rgba(0, 240, 255, 0.15)' },
  'AI & Machine Learning': { text: '#C084FC', border: 'rgba(192, 132, 252, 0.3)', glow: 'rgba(192, 132, 252, 0.15)' },
  'System Design': { text: '#B8FF3C', border: 'rgba(184, 255, 60, 0.3)', glow: 'rgba(184, 255, 60, 0.15)' },
  'Databases & Storage': { text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', glow: 'rgba(16, 185, 129, 0.15)' },
  'Backend Architecture': { text: '#FFB800', border: 'rgba(255, 184, 0, 0.3)', glow: 'rgba(255, 184, 0, 0.15)' },
  'Frontend & Web': { text: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)', glow: 'rgba(56, 189, 248, 0.15)' },
  'DevOps & Cloud': { text: '#F43F5E', border: 'rgba(244, 63, 94, 0.3)', glow: 'rgba(244, 63, 94, 0.15)' },
  'Algorithms & DSA': { text: '#F97316', border: 'rgba(249, 115, 22, 0.3)', glow: 'rgba(249, 115, 22, 0.15)' },
}

export default function BlogDetail({ slug: propSlug, embedded = false, onBack }) {
  const params = useParams()
  const navigate = useNavigate()
  const slug = propSlug || params.slug

  const [blog, setBlog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Interactive Reading States
  const [fontSize, setFontSize] = useState('text-base') // text-sm | text-base | text-lg
  const [focusMode, setFocusMode] = useState(false)
  const [completedSections, setCompletedSections] = useState({})
  const [activeConceptCheck, setActiveConceptCheck] = useState({})
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null)
  const [activeLightboxImg, setActiveLightboxImg] = useState(null)
  const [lightboxZoom, setLightboxZoom] = useState(1)

  // In-text Highlighting / Notes state
  const [highlights, setHighlights] = useState([])
  const [selectedText, setSelectedText] = useState('')
  const [toolbarPos, setToolbarPos] = useState(null)
  const [showNotesDrawer, setShowNotesDrawer] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [highlightToast, setHighlightToast] = useState(false)
  const [copiedSelectionToast, setCopiedSelectionToast] = useState(false)
  const articleRef = useRef(null)

  // Load saved progress and highlights from localStorage
  useEffect(() => {
    if (!slug) return
    try {
      const savedProgress = localStorage.getItem(`blog_progress_${slug}`)
      if (savedProgress) setCompletedSections(JSON.parse(savedProgress))

      const savedHighlights = localStorage.getItem(`blog_highlights_${slug}`)
      if (savedHighlights) setHighlights(JSON.parse(savedHighlights))
    } catch {}
  }, [slug])

  // Track scroll progress for top reading bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, progress)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch blog detail
  useEffect(() => {
    async function loadBlog() {
      if (!slug) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/blogs/${slug}`)
        const data = await res.json()
        if (data.success && data.blog) {
          setBlog(data.blog)
        } else {
          setError(data.error || 'Article not found')
        }
      } catch {
        setError('Network error loading article detail.')
      } finally {
        setIsLoading(false)
      }
    }
    loadBlog()
  }, [slug])

  // Floating text selection detection for interactive highlighter
  const handleSelection = (e) => {
    // If the event happened inside the toolbar itself, ignore it!
    if (e?.target?.closest?.('[data-highlighter-toolbar]')) {
      return
    }

    // Small delay ensures the browser selection range has settled
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectedText('')
        setToolbarPos(null)
        return
      }

      const text = selection.toString().trim()
      if (text && text.length >= 2 && text.length <= 1500) {
        try {
          const range = selection.getRangeAt(0)
          // Ensure the selection occurred inside the article content container
          if (articleRef.current && !articleRef.current.contains(range.commonAncestorContainer)) {
            setSelectedText('')
            setToolbarPos(null)
            return
          }

          const rect = range.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            setSelectedText(text)
            // Position toolbar using pure viewport coordinates (toolbar is fixed)
            const top = rect.top > 60 ? rect.top - 46 : rect.bottom + 8
            const left = Math.max(16, Math.min(window.innerWidth - 260, rect.left + rect.width / 2 - 100))
            setToolbarPos({ top, left })
            return
          }
        } catch {
          // Range access failure fallback
        }
      }

      setSelectedText('')
      setToolbarPos(null)
    }, 10)
  }

  const addHighlight = (color = '#B8FF3C') => {
    if (!selectedText) return
    const textToHighlight = selectedText.trim()
    if (!textToHighlight) return

    const newHighlight = {
      id: Date.now(),
      text: textToHighlight,
      color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [newHighlight, ...highlights]
    setHighlights(updated)
    try {
      localStorage.setItem(`blog_highlights_${slug}`, JSON.stringify(updated))
    } catch {}

    setHighlightToast(true)
    setTimeout(() => setHighlightToast(false), 2000)

    setSelectedText('')
    setToolbarPos(null)
    window.getSelection()?.removeAllRanges()
  }

  const removeHighlight = (id) => {
    const updated = highlights.filter(h => h.id !== id)
    setHighlights(updated)
    try {
      localStorage.setItem(`blog_highlights_${slug}`, JSON.stringify(updated))
    } catch {}
  }

  // Inline annotation renderer for article blocks
  const renderAnnotatedText = (text) => {
    if (!text || typeof text !== 'string') return text
    if (!highlights || highlights.length === 0) return text

    const matching = highlights.filter(h => h.text && text.includes(h.text))
    if (matching.length === 0) return text

    const matches = []
    matching.forEach(h => {
      let startIndex = 0
      while ((startIndex = text.indexOf(h.text, startIndex)) !== -1) {
        matches.push({
          id: h.id,
          color: h.color,
          start: startIndex,
          end: startIndex + h.text.length,
          text: h.text,
        })
        startIndex += h.text.length
      }
    })

    if (matches.length === 0) return text

    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))

    const segments = []
    let lastEnd = 0
    for (const m of matches) {
      if (m.start >= lastEnd) {
        segments.push(m)
        lastEnd = m.end
      }
    }

    const output = []
    let cursor = 0
    segments.forEach((seg, sIdx) => {
      if (seg.start > cursor) {
        output.push(text.slice(cursor, seg.start))
      }
      output.push(
        <mark
          key={`hl-${seg.id}-${sIdx}`}
          style={{
            backgroundColor: `${seg.color}35`,
            borderBottom: `2px solid ${seg.color}`,
            color: '#EDEDF2',
            padding: '1px 3px',
            borderRadius: '3px',
          }}
          className="relative inline-block group cursor-pointer transition-all hover:bg-opacity-60"
          title="Click to remove highlight"
          onClick={(e) => {
            e.stopPropagation()
            removeHighlight(seg.id)
          }}
        >
          {text.slice(seg.start, seg.end)}
          <span className="hidden group-hover:inline-flex items-center ml-1 text-[10px] text-red-400 bg-[#0E0E14] px-1 rounded border border-white/20 align-middle">
            ✕
          </span>
        </mark>
      )
      cursor = seg.end
    })

    if (cursor < text.length) {
      output.push(text.slice(cursor))
    }

    return output
  }

  const toggleSectionComplete = (sIdx) => {
    setCompletedSections(prev => {
      const next = { ...prev, [sIdx]: !prev[sIdx] }
      try {
        localStorage.setItem(`blog_progress_${slug}`, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const copyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText)
    setCopiedCodeIdx(idx)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (embedded) {
      navigate('/calendar/blogs')
    } else {
      navigate('/second-brain/blogs')
    }
  }

  const theme = TOPIC_THEMES[blog?.topic] || { text: '#B8FF3C', border: 'rgba(184, 255, 60, 0.3)', glow: 'rgba(184, 255, 60, 0.15)' }
  const sections = Array.isArray(blog?.content_json) ? blog.content_json : []
  const completedCount = Object.values(completedSections).filter(Boolean).length
  const totalSections = sections.length
  const masteryPercentage = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0

  const originalDomain = (() => {
    try {
      return blog?.original_url ? new URL(blog.original_url).hostname.replace(/^www\./, '') : 'Original Publication'
    } catch {
      return 'Original Publication'
    }
  })()

  if (isLoading) {
    return (
      <div className="w-full text-[#EDEDF2] py-16 px-4 max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
        <div className="h-12 w-3/4 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
        <div className="h-72 w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="w-full text-[#EDEDF2] py-20 px-4 max-w-md mx-auto text-center">
        <div className="p-8 rounded-2xl bg-[#0E0E14] border border-white/5">
          <HelpCircle className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h2 className="text-base font-bold font-mono text-white mb-2">Article Not Found</h2>
          <p className="text-xs text-[#8A8A99] mb-6">{error || 'This article is not available.'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-400 text-[#08080C] hover:bg-cyan-300 transition-all cursor-pointer"
          >
            ← Back to Deep Dives
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
      className={`min-h-screen text-[#EDEDF2] select-text transition-colors duration-300 ${focusMode ? 'bg-[#050508]' : ''} ${embedded ? 'py-4' : 'pt-20 pb-28'}`}
    >
      {/* Top Sticky Reading HUD Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full transition-all duration-100 ease-out"
          style={{
            width: `${scrollProgress}%`,
            background: theme.text,
            boxShadow: `0 0 10px ${theme.text}`,
          }}
        />
      </div>

      {/* Floating Selection Highlighter Bar */}
      {toolbarPos && (
        <div
          data-highlighter-toolbar="true"
          onMouseDown={(e) => {
            // Prevent selection from collapsing when clicking toolbar options
            e.preventDefault()
            e.stopPropagation()
          }}
          style={{
            top: `${toolbarPos.top}px`,
            left: `${toolbarPos.left}px`,
            zIndex: 9999,
          }}
          className="fixed flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E0E14] border border-white/20 shadow-2xl backdrop-blur-md select-none transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-2">
            <span className="text-[10px] font-mono text-[#8A8A99] uppercase tracking-wider font-semibold">
              Highlight:
            </span>
            <button
              onClick={() => addHighlight('#B8FF3C')}
              className="w-5 h-5 rounded-full bg-[#B8FF3C] hover:scale-125 transition-transform cursor-pointer border border-black/40 shadow-sm shadow-[#B8FF3C]/50"
              title="Lime (System / Architecture)"
            />
            <button
              onClick={() => addHighlight('#00F0FF')}
              className="w-5 h-5 rounded-full bg-[#00F0FF] hover:scale-125 transition-transform cursor-pointer border border-black/40 shadow-sm shadow-[#00F0FF]/50"
              title="Cyan (Concept / Protocol)"
            />
            <button
              onClick={() => addHighlight('#C084FC')}
              className="w-5 h-5 rounded-full bg-[#C084FC] hover:scale-125 transition-transform cursor-pointer border border-black/40 shadow-sm shadow-[#C084FC]/50"
              title="Purple (AI / Distributed)"
            />
            <button
              onClick={() => addHighlight('#FFB800')}
              className="w-5 h-5 rounded-full bg-[#FFB800] hover:scale-125 transition-transform cursor-pointer border border-black/40 shadow-sm shadow-[#FFB800]/50"
              title="Amber (Trade-off / Key Note)"
            />
          </div>

          <button
            onClick={() => {
              if (selectedText) {
                navigator.clipboard.writeText(selectedText)
                setCopiedSelectionToast(true)
                setTimeout(() => setCopiedSelectionToast(false), 2000)
              }
            }}
            className="text-[11px] font-mono text-[#8A8A99] hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
            title="Copy selected text"
          >
            {copiedSelectionToast ? (
              <span className="text-emerald-400 font-bold">✓ Copied</span>
            ) : (
              <span>Copy</span>
            )}
          </button>

          <button
            onClick={() => {
              setSelectedText('')
              setToolbarPos(null)
              window.getSelection()?.removeAllRanges()
            }}
            className="p-1 text-[#8A8A99] hover:text-white text-xs cursor-pointer ml-0.5"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification when text is highlighted */}
      <AnimatePresence>
        {highlightToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E0E14] border border-cyan-400/40 text-xs font-mono text-cyan-400 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Highlight saved to notes!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={articleRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 select-text">
        {/* Navigation & Reading Controls Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 p-3 rounded-2xl bg-[#0E0E14] border border-white/5 shadow-md">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-[#8A8A99] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Deep Dives</span>
          </button>

          {/* Interactive Mastery Progress & HUD Controls */}
          <div className="flex items-center gap-2">
            {/* Section Mastery HUD */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-mono">
              <span className="text-[#8A8A99]">Mastery:</span>
              <span style={{ color: theme.text }} className="font-bold">
                {completedCount}/{totalSections} ({masteryPercentage}%)
              </span>
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ width: `${masteryPercentage}%`, background: theme.text }}
                />
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
              <button
                onClick={() => setFontSize('text-sm')}
                className={`px-2 py-0.5 rounded cursor-pointer ${fontSize === 'text-sm' ? 'bg-white/10 text-white' : 'text-[#8A8A99] hover:text-white'}`}
                title="Small text"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('text-base')}
                className={`px-2 py-0.5 rounded cursor-pointer ${fontSize === 'text-base' ? 'bg-white/10 text-white' : 'text-[#8A8A99] hover:text-white'}`}
                title="Standard text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('text-lg')}
                className={`px-2 py-0.5 rounded cursor-pointer ${fontSize === 'text-lg' ? 'bg-white/10 text-white' : 'text-[#8A8A99] hover:text-white'}`}
                title="Large text"
              >
                A+
              </button>
            </div>

            {/* Focus Mode Button */}
            <button
              onClick={() => setFocusMode(prev => !prev)}
              className={`p-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${focusMode ? 'bg-cyan-400 text-[#08080C] border-cyan-400' : 'bg-white/5 text-[#8A8A99] border-white/5 hover:text-white'}`}
              title="Toggle Focus / Distraction-free Mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Saved Highlights Drawer Toggle */}
            <button
              onClick={() => setShowNotesDrawer(true)}
              className="relative p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[#8A8A99] hover:text-white text-xs font-mono cursor-pointer flex items-center gap-1"
              title="View Highlights & Notes"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              {highlights.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-cyan-400 text-[#08080C] text-[10px] font-bold flex items-center justify-center">
                  {highlights.length}
                </span>
              )}
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[#8A8A99] hover:text-white cursor-pointer"
              title="Copy Article Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border"
              style={{
                color: theme.text,
                backgroundColor: theme.glow,
                borderColor: theme.border,
              }}
            >
              {blog.topic}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-[#8A8A99] bg-white/[0.03] border border-white/5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8A8A99]" />
              {blog.reading_time_minutes} min read
            </span>
            {blog.published_date && (
              <span className="text-[11px] font-mono text-[#8A8A99] ml-1">
                Published {blog.published_date}
              </span>
            )}
          </div>

          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight font-display"
          >
            {blog.title}
          </h1>

          {/* Author & Source Attribution Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/10 text-xs font-mono">
            <div className="flex items-center gap-3 text-[#8A8A99]">
              <span>Author: <strong className="text-white font-medium">{blog.original_author || 'Engineering Spec'}</strong></span>
              <span>•</span>
              <span>Preserved verbatim from {originalDomain}</span>
            </div>

            {blog.original_url && (
              <a
                href={blog.original_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-cyan-400/10 hover:text-cyan-400 text-[#EDEDF2] border border-white/10 transition-colors"
              >
                <span>Read original on {originalDomain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </header>

        {/* Key Architectural Takeaways Box */}
        {blog.key_takeaways && blog.key_takeaways.length > 0 && (
          <div
            className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-[#0E0E14] via-[#12121c] to-[#0E0E14] border shadow-xl relative overflow-hidden"
            style={{ borderColor: theme.border }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: theme.glow }} />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: theme.text }} />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: theme.text }}>
                Key Architectural Takeaways
              </h2>
            </div>
            <ul className="space-y-2.5 select-text">
              {blog.key_takeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#EDEDF2] leading-relaxed select-text cursor-text">
                  <span style={{ color: theme.text }} className="font-bold mt-0.5">›</span>
                  <span>{renderAnnotatedText(takeaway)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cover Image (Contained & Crisp — Never Blurry or Stretched) */}
        {blog.cover_image && (
          <div className="mb-10 p-2 rounded-2xl border border-white/10 bg-[#08080C] max-w-3xl mx-auto shadow-2xl">
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full max-h-[420px] object-contain rounded-xl mx-auto"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        {/* Main Content Layout with Sticky TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sticky Table of Contents Sidebar */}
          {sections.length > 2 && (
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20 p-4 rounded-xl bg-[#0E0E14] border border-white/5 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-none">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A99] font-semibold">
                    Architecture Outline
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {completedCount}/{totalSections}
                  </span>
                </div>
                <nav className="space-y-1.5 text-xs font-mono">
                  {sections.map((sec, idx) => {
                    const secId = `section-${idx}`
                    const isDone = completedSections[idx]
                    return (
                      <a
                        key={idx}
                        href={`#${secId}`}
                        className={`block py-1 px-2 rounded-md transition-colors truncate flex items-center justify-between gap-1 ${isDone ? 'text-emerald-400 bg-emerald-500/5' : 'text-[#8A8A99] hover:text-white'}`}
                      >
                        <span className="truncate">{sec.heading}</span>
                        {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </a>
                    )
                  })}
                </nav>
              </div>
            </aside>
          )}

          {/* Article Verbatim Body */}
          <main className={`${sections.length > 2 ? 'lg:col-span-9' : 'lg:col-span-12'} select-text`}>
            <div className={`space-y-12 leading-relaxed ${fontSize} select-text`}>
              {sections.map((section, sIdx) => {
                const secId = `section-${sIdx}`
                const isSectionDone = completedSections[sIdx]
                const isConceptOpen = activeConceptCheck[sIdx]

                return (
                  <section
                    key={sIdx}
                    id={secId}
                    className={`scroll-mt-24 p-5 sm:p-7 rounded-2xl border transition-all duration-300 select-text ${isSectionDone ? 'bg-[#0E0E14]/50 border-emerald-500/30' : 'bg-[#0E0E14]/20 border-white/5 hover:border-white/10'}`}
                  >
                    {/* Section Heading & Completion Checkpoint */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10 mb-5">
                      <h2
                        className="text-lg sm:text-2xl font-bold tracking-tight text-white font-display select-text"
                      >
                        {section.heading}
                      </h2>
                      <button
                        onClick={() => toggleSectionComplete(sIdx)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${isSectionDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20' : 'bg-white/5 text-[#8A8A99] hover:text-white border border-white/10'}`}
                        title="Mark section as understood"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSectionDone ? 'Mastered' : 'Mark Done'}</span>
                      </button>
                    </div>

                    {/* Verbatim Section Content Blocks */}
                    <div className="space-y-5 text-[#EDEDF2]/90 select-text">
                      {section.blocks && section.blocks.map((block, bIdx) => {
                        if (block.type === 'paragraph') {
                          return (
                            <p key={bIdx} className="leading-relaxed font-normal select-text cursor-text">
                              {renderAnnotatedText(block.text)}
                            </p>
                          )
                        }

                        if (block.type === 'code') {
                          const codeKey = `${sIdx}-${bIdx}`
                          const isCopied = copiedCodeIdx === codeKey
                          return (
                            <div key={bIdx} className="relative rounded-xl overflow-hidden bg-[#08080C] border border-white/10 my-4 shadow-xl">
                              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5 text-[11px] font-mono text-[#8A8A99]">
                                <span className="text-cyan-400 uppercase">{block.language || 'code'}</span>
                                <button
                                  onClick={() => copyCode(block.code, codeKey)}
                                  className="text-xs text-[#8A8A99] hover:text-cyan-400 transition-colors cursor-pointer"
                                >
                                  {isCopied ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>
                              <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-[#EDEDF2] leading-relaxed select-text">
                                <code className="select-text">{block.code}</code>
                              </pre>
                            </div>
                          )
                        }

                        if (block.type === 'quote') {
                          return (
                            <blockquote
                              key={bIdx}
                              className="border-l-2 pl-4 py-1.5 my-4 italic text-[#EDEDF2]/80 bg-white/[0.01] rounded-r-lg select-text cursor-text"
                              style={{ borderColor: theme.text }}
                            >
                              {renderAnnotatedText(block.text)}
                            </blockquote>
                          )
                        }

                        if (block.type === 'list') {
                          return block.ordered ? (
                            <ol key={bIdx} className="list-decimal list-inside space-y-1.5 my-3 pl-2 text-[#EDEDF2]/90 select-text cursor-text">
                              {block.items.map((it, i) => (
                                <li key={i} className="leading-relaxed select-text">{renderAnnotatedText(it)}</li>
                              ))}
                            </ol>
                          ) : (
                            <ul key={bIdx} className="list-disc list-inside space-y-1.5 my-3 pl-2 text-[#EDEDF2]/90 select-text cursor-text">
                              {block.items.map((it, i) => (
                                <li key={i} className="leading-relaxed select-text">{renderAnnotatedText(it)}</li>
                              ))}
                            </ul>
                          )
                        }

                        if (block.type === 'image') {
                          return (
                            <figure
                              key={bIdx}
                              className="my-6 rounded-xl overflow-hidden bg-[#08080C] border border-white/10 max-w-2xl mx-auto shadow-xl group relative"
                            >
                              <img
                                src={block.src}
                                alt={block.alt || 'Technical diagram'}
                                className="w-full max-h-[440px] object-contain p-2 bg-black/40 cursor-zoom-in"
                                loading="lazy"
                                onClick={() => {
                                  setActiveLightboxImg(block)
                                  setLightboxZoom(1)
                                }}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                              <div
                                onClick={() => {
                                  setActiveLightboxImg(block)
                                  setLightboxZoom(1)
                                }}
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-black/70 text-[10px] font-mono text-cyan-400 flex items-center gap-1 cursor-pointer"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>Inspect Full Res</span>
                              </div>
                              {block.caption && (
                                <figcaption className="p-3 text-center text-xs font-mono text-[#8A8A99] border-t border-white/5 bg-white/[0.01]">
                                  {block.caption}
                                </figcaption>
                              )}
                            </figure>
                          )
                        }

                        return null
                      })}
                    </div>

                    {/* Interactive Knowledge Check / Concept Reflection Card */}
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <button
                        onClick={() => setActiveConceptCheck(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                        className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Interactive Concept Reflection: {section.heading}</span>
                        {isConceptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isConceptOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-cyan-400/20 text-xs font-mono space-y-2"
                        >
                          <p className="text-white font-medium">
                            Architectural Checkpoint:
                          </p>
                          <p className="text-[#8A8A99] leading-relaxed">
                            How does {section.heading} impact system fault-tolerance and consistency? Make sure to review the trade-offs described above before moving on.
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => toggleSectionComplete(sIdx)}
                              className="px-3 py-1 rounded-md bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 text-[11px] font-mono hover:bg-cyan-400/20 transition-all cursor-pointer"
                            >
                              {isSectionDone ? '✓ Section Marked Complete' : 'Confirm Understanding & Mark Complete'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>

            {/* Bottom Section Mastery Completion Banner */}
            {completedCount === totalSections && totalSections > 0 && (
              <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold font-mono text-white">
                  🎉 Deep Dive Mastered!
                </h3>
                <p className="text-xs text-[#8A8A99]">
                  You have reviewed and mastered all {totalSections} sections of {blog.title}.
                </p>
              </div>
            )}

            {/* Article Footer Attribution */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8A8A99]">
              <div>
                <span>Original article by </span>
                <span className="text-white">{blog.original_author || 'Engineering Spec'}</span>
                <span>. Text content preserved verbatim.</span>
              </div>

              {blog.original_url && (
                <a
                  href={blog.original_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>View on {originalDomain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Interactive Diagram Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxImg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
              {/* Controls bar */}
              <div className="flex items-center justify-between w-full p-3 bg-[#0E0E14] border border-white/10 rounded-t-xl text-xs font-mono">
                <span className="text-white/80 truncate max-w-md">
                  {activeLightboxImg.caption || activeLightboxImg.alt || 'High-Resolution Architecture Diagram'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLightboxZoom(z => Math.max(0.5, z - 0.25))}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white/60 text-[10px]">{Math.round(lightboxZoom * 100)}%</span>
                  <button
                    onClick={() => setLightboxZoom(z => Math.min(3, z + 0.25))}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveLightboxImg(null)}
                    className="p-1 ml-2 text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-full overflow-auto bg-black p-4 rounded-b-xl border-x border-b border-white/10 flex items-center justify-center min-h-[300px]">
                <img
                  src={activeLightboxImg.src}
                  alt={activeLightboxImg.alt}
                  style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
                  className="transition-transform duration-200 max-h-[75vh] object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Highlights & Notes Slide-Over Drawer */}
      <AnimatePresence>
        {showNotesDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md h-full bg-[#0E0E14] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold font-mono text-white">
                      Study Highlights & Notes ({highlights.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNotesDrawer(false)}
                    className="text-[#8A8A99] hover:text-white cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#8A8A99] mb-4">
                  Select text while reading to instantly save architectural highlights and study quotes.
                </p>

                {highlights.length === 0 ? (
                  <div className="py-16 text-center text-xs font-mono text-[#8A8A99]">
                    No highlighted quotes yet. Select text in the article to create your first highlight!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {highlights.map((h) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 relative group"
                        style={{ borderLeft: `3px solid ${h.color}` }}
                      >
                        <p className="text-xs text-[#EDEDF2] leading-relaxed italic">
                          "{h.text}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8A99]">
                          <span>{h.timestamp}</span>
                          <button
                            onClick={() => removeHighlight(h.id)}
                            className="text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {highlights.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      const allText = highlights.map(h => `- "${h.text}"`).join('\n\n')
                      navigator.clipboard.writeText(allText)
                      alert('Copied all study notes to clipboard!')
                    }}
                    className="w-full py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-400 text-[#08080C] hover:bg-cyan-300 transition-all cursor-pointer"
                  >
                    Copy All Notes to Clipboard
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
