/**
 * blogAiService.js
 * 
 * Uses Groq (qwen/qwen3.8-27b) and OpenRouter (nvidia/nemotron-3.5-lightning:free)
 * to analyze external blog articles, categorize topics & subtopics, and structure
 * curated takeaways WITHOUT ALTERING ANY AUTHOR VERBATIM CONTENT.
 */

function getCleanKeys(keyString) {
  if (!keyString) return []
  return keyString
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 5 && !k.includes('your_'))
}

let keyCoolingMap = new Map()

function getUsableKey(keys) {
  const now = Date.now()
  for (const k of keys) {
    const coolUntil = keyCoolingMap.get(k) || 0
    if (now >= coolUntil) return k
  }
  return keys[0]
}

function markKeyCooling(key, durationMs = 60000) {
  keyCoolingMap.set(key, Date.now() + durationMs)
}

/**
 * Deterministic fallback analysis if LLM is offline or unconfigured
 */
function heuristicBlogAnalysis(scraped) {
  const combinedText = `${scraped.title} ${scraped.summary} ${scraped.sections.map(s => s.heading + ' ' + s.blocks.map(b => b.text || '').join(' ')).join(' ')}`.toLowerCase()

  // Topic classification rules
  let topic = 'System Design'
  let subtopics = []

  if (combinedText.includes('raft') || combinedText.includes('paxos') || combinedText.includes('distributed') || combinedText.includes('consensus') || combinedText.includes('cap theorem')) {
    topic = 'Distributed Systems'
    subtopics = ['Consensus', 'Fault Tolerance', 'Distributed Systems', 'Replication']
  } else if (combinedText.includes('llm') || combinedText.includes('transformer') || combinedText.includes('ai') || combinedText.includes('machine learning') || combinedText.includes('rag') || combinedText.includes('embeddings')) {
    topic = 'AI & Machine Learning'
    subtopics = ['Large Language Models', 'RAG', 'AI Architecture', 'Machine Learning']
  } else if (combinedText.includes('postgres') || combinedText.includes('mysql') || combinedText.includes('database') || combinedText.includes('redis') || combinedText.includes('sql') || combinedText.includes('index')) {
    topic = 'Databases & Storage'
    subtopics = ['Databases', 'Indexing', 'Storage Engines', 'Query Optimization']
  } else if (combinedText.includes('react') || combinedText.includes('css') || combinedText.includes('dom') || combinedText.includes('javascript') || combinedText.includes('browser') || combinedText.includes('frontend')) {
    topic = 'Frontend & Web'
    subtopics = ['Frontend Architecture', 'Web Performance', 'JavaScript', 'UI Engineering']
  } else if (combinedText.includes('kubernetes') || combinedText.includes('docker') || combinedText.includes('aws') || combinedText.includes('devops') || combinedText.includes('ci/cd')) {
    topic = 'DevOps & Cloud'
    subtopics = ['Cloud Infrastructure', 'Kubernetes', 'DevOps', 'Containers']
  } else if (combinedText.includes('microservice') || combinedText.includes('api') || combinedText.includes('grpc') || combinedText.includes('backend') || combinedText.includes('concurrency')) {
    topic = 'Backend Architecture'
    subtopics = ['High Throughput', 'Microservices', 'Concurrency', 'Backend']
  } else if (combinedText.includes('leetcode') || combinedText.includes('graph') || combinedText.includes('tree') || combinedText.includes('dynamic programming') || combinedText.includes('algorithm')) {
    topic = 'Algorithms & DSA'
    subtopics = ['Algorithms', 'Data Structures', 'Optimization', 'Problem Solving']
  } else {
    topic = 'System Design'
    subtopics = ['Architecture', 'Scalability', 'Reliability', 'Engineering Practices']
  }

  // Key takeaways extracted from prominent section headings or summary
  const keyTakeaways = []
  if (scraped.summary) {
    keyTakeaways.push(scraped.summary.slice(0, 150) + '...')
  }
  for (const s of scraped.sections.slice(1, 4)) {
    if (s.heading && s.heading !== 'Conclusion' && s.heading !== 'References') {
      keyTakeaways.push(`Core insight on ${s.heading}: review internal mechanisms and trade-offs.`)
    }
  }
  if (keyTakeaways.length === 0) {
    keyTakeaways.push(`In-depth breakdown of ${scraped.title}.`)
  }

  return {
    topic,
    subtopics,
    summary: scraped.summary || `A thorough engineering deep-dive on ${scraped.title}, examining foundational principles and implementation details.`,
    keyTakeaways,
    readingTimeMinutes: scraped.readingTimeMinutes || 5,
    coverImage: scraped.coverImage || (scraped.allImages[0]?.src || ''),
  }
}

/**
 * Execute LLM analysis on scraped blog content
 */
export async function analyzeBlogWithAi(scraped) {
  // Outline of sections to pass to LLM (keeps token count efficient while providing full architectural context)
  const outline = scraped.sections.map(s => {
    const blockSummaries = s.blocks.slice(0, 3).map(b => {
      if (b.type === 'paragraph') return b.text.slice(0, 140) + '...'
      if (b.type === 'code') return `[Code: ${b.language || 'snippet'}]`
      if (b.type === 'quote') return `[Quote: ${b.text.slice(0, 80)}]`
      if (b.type === 'image') return `[Image: ${b.caption || b.alt}]`
      return ''
    }).filter(Boolean)
    return `### ${s.heading}\n${blockSummaries.join('\n')}`
  }).join('\n\n')

  const prompt = `
You are analyzing an external engineering blog article.

TITLE: ${scraped.title}
AUTHOR: ${scraped.originalAuthor}
OVERVIEW: ${scraped.summary}
TOTAL WORDS: ${scraped.wordCount}
AVAILABLE IMAGES:
${scraped.allImages.map(img => `- ${img.src} (${img.caption || img.alt || 'article image'})`).join('\n')}

ARTICLE OUTLINE & SECTION SAMPLES:
${outline.slice(0, 4500)}

CRITICAL INSTRUCTIONS:
1. DO NOT summarize, alter, or rewrite the author's verbatim article content. The author's exact text is preserved 100% intact.
2. Select the single best primary engineering topic from:
   ["System Design", "Distributed Systems", "AI & Machine Learning", "Backend Architecture", "Databases & Storage", "Frontend & Web", "DevOps & Cloud", "Algorithms & DSA", "Security & Reliability"]
3. Provide 3-5 fine-grained subtopics / tags (e.g. ["Raft Consensus", "Leader Election", "Fault Tolerance", "Distributed Logs"]).
4. Provide a 2-3 sentence curated summary of what makes this article valuable to engineers.
5. Provide 3-5 concrete key takeaways that summarize the core principles or architectural learnings.
6. Select the best cover_image from the AVAILABLE IMAGES list ONLY if it is a genuine architectural diagram, system flowchart, or clear technical illustration. NEVER select an author photo, headshot, avatar, icon, or logo. If no high-quality content illustration exists, return empty string "".
7. Estimate reading time in minutes.

OUTPUT JSON ONLY. Strict schema:
{
  "topic": "Distributed Systems",
  "subtopics": ["Raft", "Consensus", "Fault Tolerance"],
  "summary": "2-3 concise sentences overviewing the article",
  "keyTakeaways": [
    "Takeaway 1",
    "Takeaway 2",
    "Takeaway 3"
  ],
  "coverImage": "https://... or empty string",
  "readingTimeMinutes": 6
}
`

  const groqKeys = getCleanKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY)
  const openRouterKeys = getCleanKeys(process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY)

  // 1. Try Groq (qwen/qwen3.8-27b)
  if (groqKeys.length > 0) {
    const key = getUsableKey(groqKeys)
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical editor. You output valid JSON ONLY with fields: topic, subtopics, summary, keyTakeaways, coverImage, readingTimeMinutes.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok) {
        const data = await response.json()
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        if (parsed.topic && Array.isArray(parsed.subtopics)) {
          return {
            topic: parsed.topic,
            subtopics: parsed.subtopics,
            summary: parsed.summary || scraped.summary,
            keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
            coverImage: parsed.coverImage || scraped.coverImage || (scraped.allImages[0]?.src || ''),
            readingTimeMinutes: parsed.readingTimeMinutes || scraped.readingTimeMinutes,
            provider: 'groq',
          }
        }
      } else {
        markKeyCooling(key, 30000)
      }
    } catch (err) {
      console.warn('[Blog AI] Groq request warning:', err.message)
      markKeyCooling(key, 30000)
    }
  }

  // 2. Try OpenRouter (nvidia/nemotron-3.5-lightning:free)
  if (openRouterKeys.length > 0) {
    const key = getUsableKey(openRouterKeys)
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': 'https://portfolio.local',
          'X-Title': 'Curated Tech Blogs',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3.5-lightning:free',
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical editor. Output valid JSON only with topic, subtopics, summary, keyTakeaways, coverImage, readingTimeMinutes.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || '{}'
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.topic) {
            return {
              topic: parsed.topic,
              subtopics: Array.isArray(parsed.subtopics) ? parsed.subtopics : [],
              summary: parsed.summary || scraped.summary,
              keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
              coverImage: parsed.coverImage || scraped.coverImage || (scraped.allImages[0]?.src || ''),
              readingTimeMinutes: parsed.readingTimeMinutes || scraped.readingTimeMinutes,
              provider: 'openrouter',
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Blog AI] OpenRouter request warning:', err.message)
    }
  }

  // 3. Fallback to heuristic classification (guaranteed offline reliability)
  return {
    ...heuristicBlogAnalysis(scraped),
    provider: 'heuristic',
  }
}
