import * as cheerio from 'cheerio'

/**
 * Scrapes an external internet tech blog article and extracts its metadata,
 * original verbatim text blocks, code snippets, and original image links.
 * 
 * Strict Constraint: Verbatim text from the original author is preserved 100% intact.
 */
export async function scrapeBlogArticle(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Valid blog article URL is required.')
  }

  let parsedUrl
  try {
    parsedUrl = new URL(targetUrl.trim())
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('URL must use HTTP or HTTPS protocol.')
    }
  } catch (err) {
    throw new Error(`Invalid URL format: ${err.message}`)
  }

  // Fetch HTML with realistic browser headers
  const response = await fetch(parsedUrl.href, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    signal: AbortSignal.timeout(18000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch article from ${parsedUrl.hostname} (Status ${response.status}: ${response.statusText})`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // 1. Extract Metadata
  let title = $('meta[property="og:title"]').attr('content')
    || $('meta[name="twitter:title"]').attr('content')
    || $('title').text()
    || $('h1').first().text()
    || ''
  title = title.replace(/\s*([|–—\-:]\s*(Medium|Substack|Dev\.to|Hacker News|FreeCodeCamp|Hashnode|Blog)).*$/i, '').trim()

  let description = $('meta[property="og:description"]').attr('content')
    || $('meta[name="description"]').attr('content')
    || $('meta[name="twitter:description"]').attr('content')
    || ''
  description = description.trim()

  let author = $('meta[name="author"]').attr('content')
    || $('meta[property="article:author"]').attr('content')
    || $('meta[name="twitter:creator"]').attr('content')
    || $('[rel="author"]').first().text()
    || $('.author').first().text()
    || parsedUrl.hostname.replace(/^www\./, '')
  author = author.trim()

  let publishedDate = $('meta[property="article:published_time"]').attr('content')
    || $('meta[name="publish-date"]').attr('content')
    || $('time').first().attr('datetime')
    || $('time').first().text()
    || new Date().toISOString().split('T')[0]
  if (publishedDate && publishedDate.includes('T')) {
    publishedDate = publishedDate.split('T')[0]
  }

  let coverImage = $('meta[property="og:image"]').attr('content')
    || $('meta[name="twitter:image"]').attr('content')
    || ''
  if (coverImage) {
    try {
      coverImage = new URL(coverImage, parsedUrl.href).href
    } catch {
      coverImage = ''
    }
  }

  // 2. Clean clutter & irrelevant elements before article parsing
  $('script, style, noscript, nav, footer, header, aside, form, svg, iframe, .advertisement, .ad, .comments, .social-share, .newsletter-signup, .related-posts, .cookie-banner').remove()

  // 3. Find primary article container
  let $contentContainer = $('article').first()
  if (!$contentContainer.length) {
    $contentContainer = $('[role="main"], main, .post-content, .article-content, .entry-content, .story-content, .markdown-body, #content').first()
  }
  if (!$contentContainer.length) {
    $contentContainer = $('body')
  }

  // 4. Extract structured sections and verbatim elements
  const sections = []
  let currentSection = {
    heading: 'Introduction',
    level: 2,
    blocks: [],
  }

  const elements = $contentContainer.find('h1, h2, h3, h4, p, pre, blockquote, ul, ol, figure, img')
  let wordCount = 0
  const allImages = []

  elements.each((_, el) => {
    const tagName = el.tagName.toLowerCase()
    const $el = $(el)

    // Skip nested elements already captured by their parent pre / figure / ul
    if ($el.closest('pre').length && tagName !== 'pre') return
    if ($el.closest('figure').length && tagName !== 'figure' && tagName !== 'figcaption') return
    if (($el.closest('ul').length || $el.closest('ol').length) && tagName !== 'ul' && tagName !== 'ol') return

    if (/^h[1-4]$/.test(tagName)) {
      const headingText = $el.text().trim()
      if (headingText && headingText.length < 200) {
        // If current section has blocks, push it and start new section
        if (currentSection.blocks.length > 0) {
          sections.push(currentSection)
        }
        currentSection = {
          heading: headingText,
          level: parseInt(tagName.replace('h', ''), 10),
          blocks: [],
        }
      }
    } else if (tagName === 'p') {
      const pText = $el.text().trim()
      if (pText && pText.length > 10) {
        currentSection.blocks.push({
          type: 'paragraph',
          text: pText,
        })
        wordCount += pText.split(/\s+/).length
      }
    } else if (tagName === 'pre') {
      const codeText = $el.text().trim()
      if (codeText) {
        // Detect language class if specified
        const codeClass = $el.find('code').attr('class') || $el.attr('class') || ''
        const langMatch = codeClass.match(/language-([a-zA-Z0-9_\-]+)/)
        const language = langMatch ? langMatch[1] : 'text'

        currentSection.blocks.push({
          type: 'code',
          code: codeText,
          language,
        })
        wordCount += 20 // nominal estimation for code block
      }
    } else if (tagName === 'blockquote') {
      const quoteText = $el.text().trim()
      if (quoteText) {
        currentSection.blocks.push({
          type: 'quote',
          text: quoteText,
        })
        wordCount += quoteText.split(/\s+/).length
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items = []
      $el.find('> li').each((_, li) => {
        const itemText = $(li).text().trim()
        if (itemText) items.push(itemText)
      })
      if (items.length > 0) {
        currentSection.blocks.push({
          type: 'list',
          ordered: tagName === 'ol',
          items,
        })
        items.forEach(it => { wordCount += it.split(/\s+/).length })
      }
    } else if (tagName === 'figure' || tagName === 'img') {
      let imgSrc = ''
      let imgAlt = ''
      let caption = ''

      if (tagName === 'figure') {
        const $img = $el.find('img').first()
        imgSrc = $img.attr('src') || $img.attr('data-src') || ''
        imgAlt = $img.attr('alt') || ''
        caption = $el.find('figcaption').text().trim()
      } else {
        imgSrc = $el.attr('src') || $el.attr('data-src') || ''
        imgAlt = $el.attr('alt') || ''
      }

      if (imgSrc && !imgSrc.startsWith('data:image/svg') && !imgSrc.includes('pixel.gif') && !imgSrc.includes('tracking')) {
        try {
          const resolvedSrc = new URL(imgSrc, parsedUrl.href).href
          const imageObj = {
            type: 'image',
            src: resolvedSrc,
            alt: imgAlt || title,
            caption: caption || imgAlt || '',
          }
          currentSection.blocks.push(imageObj)
          allImages.push(imageObj)

          if (!coverImage) {
            coverImage = resolvedSrc
          }
        } catch {
          // ignore invalid relative image URL
        }
      }
    }
  })

  if (currentSection.blocks.length > 0) {
    sections.push(currentSection)
  }

  // If coverImage is still empty, look at any images found in body
  if (!coverImage && allImages.length > 0) {
    coverImage = allImages[0].src
  }

  // Calculate estimated reading time (standard: 200 words per minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  // Construct raw markdown representation for export / fallback
  let rawMarkdown = `# ${title}\n\n`
  if (author) rawMarkdown += `**Author:** ${author}\n\n`
  if (publishedDate) rawMarkdown += `**Date:** ${publishedDate}\n\n`
  if (coverImage) rawMarkdown += `![${title}](${coverImage})\n\n`

  for (const sec of sections) {
    const hashes = '#'.repeat(Math.min(6, Math.max(2, sec.level)))
    rawMarkdown += `${hashes} ${sec.heading}\n\n`
    for (const b of sec.blocks) {
      if (b.type === 'paragraph') rawMarkdown += `${b.text}\n\n`
      else if (b.type === 'code') rawMarkdown += `\`\`\`${b.language || ''}\n${b.code}\n\`\`\`\n\n`
      else if (b.type === 'quote') rawMarkdown += `> ${b.text}\n\n`
      else if (b.type === 'list') {
        b.items.forEach((it, idx) => {
          rawMarkdown += b.ordered ? `${idx + 1}. ${it}\n` : `- ${it}\n`
        })
        rawMarkdown += '\n'
      } else if (b.type === 'image') {
        rawMarkdown += `![${b.alt}](${b.src})\n*${b.caption || b.alt}*\n\n`
      }
    }
  }

  return {
    title: title || 'Curated Engineering Deep Dive',
    originalUrl: parsedUrl.href,
    originalAuthor: author || 'Unknown Author',
    publishedDate: publishedDate || new Date().toISOString().split('T')[0],
    summary: description || (sections[0]?.blocks.find(b => b.type === 'paragraph')?.text || '').slice(0, 280),
    coverImage,
    readingTimeMinutes,
    sections,
    allImages,
    wordCount,
    rawMarkdown,
  }
}
