import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { API_BASE_URL } from '../utils/apiConfig'

export default function BlogDetail() {
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSectionId, setActiveSectionId] = useState('')

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
      } catch (err) {
        setError('Network error loading article detail.')
      } finally {
        setIsLoading(false)
      }
    }
    loadBlog()
  }, [slug])

  const copyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText)
    setCopiedCodeIdx(idx)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
  }

  // Get domain name from URL
  const originalDomain = (() => {
    try {
      return blog?.original_url ? new URL(blog.original_url).hostname.replace(/^www\./, '') : 'Original Site'
    } catch {
      return 'Original Site'
    }
  })()

  if (isLoading) {
    return (
      <div className="min-h-screen text-[#EDEDF2] pt-28 pb-20 px-4 max-w-4xl mx-auto">
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-8" />
        <div className="h-12 w-3/4 bg-white/5 rounded animate-pulse mb-6" />
        <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse mb-12" />
        <div className="h-96 w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen text-[#EDEDF2] pt-32 pb-20 px-4 max-w-xl mx-auto text-center">
        <div className="p-8 rounded-2xl bg-[#0E0E14] border border-white/5">
          <h2 className="text-xl font-bold font-mono text-white mb-2">Article Not Found</h2>
          <p className="text-xs text-[#8A8A99] mb-6">{error || "The requested article could not be located."}</p>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-[#B8FF3C] text-[#08080C] hover:bg-[#a6ec31] transition-all"
          >
            ← Back to Curated Articles
          </Link>
        </div>
      </div>
    )
  }

  const sections = Array.isArray(blog.content_json) ? blog.content_json : []

  return (
    <div className="min-h-screen text-[#EDEDF2] pt-20 pb-28">
      {/* Top sticky scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50">
        <div
          className="h-full bg-[#B8FF3C] transition-all duration-100 ease-out shadow-[0_0_8px_#B8FF3C]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8A8A99] hover:text-[#B8FF3C] transition-colors"
          >
            <span>←</span> Back to All Deep Dives
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          {/* Topic & Read Time Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-[#B8FF3C]/10 text-[#B8FF3C] border border-[#B8FF3C]/30">
              {blog.topic}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-[#8A8A99] bg-white/[0.03] border border-white/5">
              ⚡ {blog.reading_time_minutes} min read
            </span>
            {blog.published_date && (
              <span className="text-[11px] font-mono text-[#8A8A99] ml-2">
                Published {blog.published_date}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {blog.title}
          </h1>

          {/* Metadata Row & Original Link CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/5 text-xs font-mono">
            <div className="flex items-center gap-3 text-[#8A8A99]">
              <span>Author: <strong className="text-white font-normal">{blog.original_author || 'Engineering Team'}</strong></span>
              <span>•</span>
              <span>Preserved verbatim from {originalDomain}</span>
            </div>

            {blog.original_url && (
              <a
                href={blog.original_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-[#B8FF3C]/10 hover:text-[#B8FF3C] text-[#EDEDF2] border border-white/10 transition-colors"
              >
                <span>Read original on {originalDomain}</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </header>

        {/* Key Architectural Takeaways Box */}
        {blog.key_takeaways && blog.key_takeaways.length > 0 && (
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-[#0E0E14] to-[#12121c] border border-[#B8FF3C]/30 shadow-[0_4px_24px_rgba(184,255,60,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8FF3C]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#B8FF3C]" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#B8FF3C]">
                Key Engineering Takeaways
              </h2>
            </div>
            <ul className="space-y-2.5">
              {blog.key_takeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#EDEDF2] leading-relaxed">
                  <span className="text-[#B8FF3C] mt-0.5 font-bold">›</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cover Image */}
        {blog.cover_image && (
          <div className="mb-12 rounded-2xl overflow-hidden border border-white/5 bg-black/40">
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full max-h-[500px] object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        {/* Main Content Layout with Sticky TOC on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sticky Table of Contents Sidebar */}
          {sections.length > 2 && (
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 p-4 rounded-xl bg-[#0E0E14] border border-white/5 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none">
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A99] mb-3 font-semibold">
                  Table of Contents
                </h3>
                <nav className="space-y-1.5 text-xs font-mono">
                  {sections.map((sec, idx) => {
                    const secId = `section-${idx}`
                    return (
                      <a
                        key={idx}
                        href={`#${secId}`}
                        className="block py-1 text-[#8A8A99] hover:text-[#B8FF3C] transition-colors truncate"
                      >
                        {sec.heading}
                      </a>
                    )
                  })}
                </nav>
              </div>
            </aside>
          )}

          {/* Article Verbatim Body */}
          <main className={sections.length > 2 ? 'lg:col-span-9' : 'lg:col-span-12'}>
            <div className="space-y-10 leading-relaxed text-[#EDEDF2]">
              {sections.map((section, sIdx) => {
                const secId = `section-${sIdx}`
                return (
                  <section key={sIdx} id={secId} className="scroll-mt-24 space-y-5">
                    {section.heading && (
                      <h2
                        className="text-xl sm:text-2xl font-bold tracking-tight text-white pt-4 pb-2 border-b border-white/5"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {section.heading}
                      </h2>
                    )}

                    {section.blocks && section.blocks.map((block, bIdx) => {
                      if (block.type === 'paragraph') {
                        return (
                          <p key={bIdx} className="text-sm sm:text-base text-[#EDEDF2]/90 leading-relaxed font-normal">
                            {block.text}
                          </p>
                        )
                      }

                      if (block.type === 'code') {
                        const codeKey = `${sIdx}-${bIdx}`
                        const isCopied = copiedCodeIdx === codeKey
                        return (
                          <div key={bIdx} className="relative rounded-xl overflow-hidden bg-[#08080C] border border-white/10 my-4 shadow-lg">
                            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[11px] font-mono text-[#8A8A99]">
                              <span>{block.language || 'code'}</span>
                              <button
                                onClick={() => copyCode(block.code, codeKey)}
                                className="text-xs text-[#8A8A99] hover:text-[#B8FF3C] transition-colors cursor-pointer"
                              >
                                {isCopied ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-[#EDEDF2] leading-relaxed">
                              <code>{block.code}</code>
                            </pre>
                          </div>
                        )
                      }

                      if (block.type === 'quote') {
                        return (
                          <blockquote
                            key={bIdx}
                            className="border-l-2 border-[#B8FF3C] pl-4 py-1 my-4 text-sm sm:text-base italic text-[#EDEDF2]/80 bg-white/[0.01] rounded-r-lg"
                          >
                            {block.text}
                          </blockquote>
                        )
                      }

                      if (block.type === 'list') {
                        return block.ordered ? (
                          <ol key={bIdx} className="list-decimal list-inside space-y-1.5 text-sm sm:text-base text-[#EDEDF2]/90 my-3 pl-2">
                            {block.items.map((it, i) => (
                              <li key={i} className="leading-relaxed">{it}</li>
                            ))}
                          </ol>
                        ) : (
                          <ul key={bIdx} className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-[#EDEDF2]/90 my-3 pl-2">
                            {block.items.map((it, i) => (
                              <li key={i} className="leading-relaxed">{it}</li>
                            ))}
                          </ul>
                        )
                      }

                      if (block.type === 'image') {
                        return (
                          <figure key={bIdx} className="my-6 rounded-xl overflow-hidden bg-[#08080C] border border-white/5">
                            <img
                              src={block.src}
                              alt={block.alt || 'Article diagram'}
                              className="w-full max-h-[550px] object-contain bg-black/30"
                              loading="lazy"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
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
                  </section>
                )
              })}
            </div>

            {/* Article Footer Attribution */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8A8A99]">
              <div>
                <span>Original article by </span>
                <span className="text-white">{blog.original_author || 'Original Author'}</span>
                <span>. Text content preserved verbatim.</span>
              </div>

              {blog.original_url && (
                <a
                  href={blog.original_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#B8FF3C] hover:underline"
                >
                  View on {originalDomain} ↗
                </a>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
