import crypto from 'crypto'
import { db } from '../db/database.js'
import { scrapeBlogArticle } from '../services/blogScraperService.js'
import { analyzeBlogWithAi } from '../services/blogAiService.js'
import { persistBlogToMongo, deleteBlogFromMongo } from '../db/mongoPersistence.js'

function safeJsonParse(str, fallback = []) {
  if (!str) return fallback
  if (typeof str !== 'string') return str
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 80)
}

/**
 * List all curated blogs with filtering and pagination
 */
export function listBlogs(req, res) {
  try {
    const { topic, subtopic, search, page = 1, limit = 12 } = req.query
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)

    let query = `
      SELECT id, title, slug, original_url, original_author, published_date,
             topic, subtopics, summary, cover_image, reading_time_minutes,
             key_takeaways, is_published, created_at, updated_at
      FROM blogs
      WHERE is_published = 1
    `
    const params = []

    if (topic && topic !== 'All') {
      query += ' AND topic = ?'
      params.push(topic)
    }

    if (subtopic) {
      query += ' AND subtopics LIKE ?'
      params.push(`%"${subtopic}"%`)
    }

    if (search) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR original_author LIKE ?)'
      const s = `%${search.trim()}%`
      params.push(s, s, s)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit, 10), offset)

    const blogs = db.prepare(query).all(...params)

    // Format subtopics and key_takeaways as genuine arrays
    const formattedBlogs = blogs.map(b => ({
      ...b,
      subtopics: safeJsonParse(b.subtopics, []),
      key_takeaways: safeJsonParse(b.key_takeaways, []),
    }))

    // Total count for pagination
    let countQuery = 'SELECT count(*) as total FROM blogs WHERE is_published = 1'
    const countParams = []
    if (topic && topic !== 'All') {
      countQuery += ' AND topic = ?'
      countParams.push(topic)
    }
    if (subtopic) {
      countQuery += ' AND subtopics LIKE ?'
      countParams.push(`%"${subtopic}"%`)
    }
    if (search) {
      countQuery += ' AND (title LIKE ? OR summary LIKE ? OR original_author LIKE ?)'
      const s = `%${search.trim()}%`
      countParams.push(s, s, s)
    }
    const totalCount = db.prepare(countQuery).get(...countParams)?.total || 0

    return res.json({
      success: true,
      blogs: formattedBlogs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
      },
    })
  } catch (err) {
    console.error('Error listing blogs:', err)
    return res.status(500).json({ success: false, error: 'Failed to retrieve blogs.' })
  }
}

/**
 * Get all available topics and subtopics with counts
 */
export function getBlogTopics(req, res) {
  try {
    const rows = db.prepare(`
      SELECT topic, subtopics
      FROM blogs
      WHERE is_published = 1
    `).all()

    const topicCounts = {}
    const subtopicCounts = {}

    rows.forEach(r => {
      topicCounts[r.topic] = (topicCounts[r.topic] || 0) + 1
      const subs = safeJsonParse(r.subtopics, [])
      subs.forEach(s => {
        subtopicCounts[s] = (subtopicCounts[s] || 0) + 1
      })
    })

    const topics = Object.entries(topicCounts).map(([name, count]) => ({ name, count }))
    const subtopics = Object.entries(subtopicCounts).map(([name, count]) => ({ name, count }))

    return res.json({
      success: true,
      topics,
      subtopics,
      totalBlogs: rows.length,
    })
  } catch (err) {
    console.error('Error getting blog topics:', err)
    return res.status(500).json({ success: false, error: 'Failed to retrieve topics.' })
  }
}

/**
 * Get a single blog by slug or ID with full content sections
 */
export function getBlogBySlug(req, res) {
  try {
    const { identifier } = req.params

    const blog = db.prepare(`
      SELECT * FROM blogs
      WHERE (slug = ? OR id = ?) AND is_published = 1
    `).get(identifier, identifier)

    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found.' })
    }

    return res.json({
      success: true,
      blog: {
        ...blog,
        subtopics: safeJsonParse(blog.subtopics, []),
        key_takeaways: safeJsonParse(blog.key_takeaways, []),
        content_json: safeJsonParse(blog.content_json, []),
      },
    })
  } catch (err) {
    console.error('Error retrieving blog:', err)
    return res.status(500).json({ success: false, error: 'Failed to retrieve blog detail.' })
  }
}

/**
 * Import and curate a blog article from an internet URL
 * Scrapes verbatim content, analyzes topics with LLM, and persists to DB
 */
export async function importBlog(req, res) {
  try {
    const { url } = req.body
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid article URL is required.' })
    }

    // Step 1: Check if already imported
    const existing = db.prepare('SELECT id, slug, title FROM blogs WHERE original_url = ?').get(url.trim())
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'This article has already been curated into your blogs.',
        existingSlug: existing.slug,
      })
    }

    // Step 2: Scrape external article preserving exact text & images
    const scraped = await scrapeBlogArticle(url.trim())

    // Step 3: Run AI classification for topics, subtopics, and key takeaways
    const aiAnalysis = await analyzeBlogWithAi(scraped)

    // Step 4: Build unique slug
    let baseSlug = slugify(scraped.title) || 'curated-article'
    let slug = baseSlug
    let counter = 1
    while (db.prepare('SELECT 1 FROM blogs WHERE slug = ?').get(slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const blogId = `blog_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
    const now = new Date().toISOString()

    const newBlog = {
      id: blogId,
      title: scraped.title,
      slug,
      original_url: scraped.originalUrl,
      original_author: scraped.originalAuthor,
      published_date: scraped.publishedDate,
      topic: aiAnalysis.topic,
      subtopics: aiAnalysis.subtopics,
      summary: aiAnalysis.summary,
      cover_image: aiAnalysis.coverImage || scraped.coverImage || '',
      reading_time_minutes: aiAnalysis.readingTimeMinutes || scraped.readingTimeMinutes || 5,
      content_json: scraped.sections,
      key_takeaways: aiAnalysis.keyTakeaways,
      raw_markdown: scraped.rawMarkdown,
      is_published: 1,
      created_at: now,
      updated_at: now,
    }

    // Insert into SQLite
    db.prepare(`
      INSERT INTO blogs (
        id, title, slug, original_url, original_author, published_date,
        topic, subtopics, summary, cover_image, reading_time_minutes,
        content_json, key_takeaways, raw_markdown, is_published, created_at, updated_at
      ) VALUES (
        @id, @title, @slug, @original_url, @original_author, @published_date,
        @topic, @subtopics, @summary, @cover_image, @reading_time_minutes,
        @content_json, @key_takeaways, @raw_markdown, @is_published, @created_at, @updated_at
      )
    `).run({
      ...newBlog,
      subtopics: JSON.stringify(newBlog.subtopics),
      key_takeaways: JSON.stringify(newBlog.key_takeaways),
      content_json: JSON.stringify(newBlog.content_json),
    })

    // Persist to MongoDB Atlas
    persistBlogToMongo(newBlog).catch(err => {
      console.warn('[MongoDB Atlas] Background blog persistence warning:', err.message)
    })

    return res.status(201).json({
      success: true,
      blog: newBlog,
      message: 'Article successfully scraped, AI-analyzed, and curated!',
    })
  } catch (err) {
    console.error('Error importing blog:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to import and analyze article.',
    })
  }
}

/**
 * Delete a curated blog (Admin only)
 */
export async function deleteBlog(req, res) {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM blogs WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found.' })
    }

    db.prepare('DELETE FROM blogs WHERE id = ?').run(id)
    deleteBlogFromMongo(id).catch(err => {
      console.warn('[MongoDB Atlas] Background blog deletion warning:', err.message)
    })

    return res.json({ success: true, message: 'Blog deleted successfully.', deletedId: id })
  } catch (err) {
    console.error('Error deleting blog:', err)
    return res.status(500).json({ success: false, error: 'Failed to delete blog.' })
  }
}
