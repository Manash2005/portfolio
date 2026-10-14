import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from './database.js'
import { connectMongo, isMongoConnected } from './mongo.js'
import { DsaProblemModel } from '../models/DsaProblem.js'
import { comprehensiveProblems as initialCatalog } from './comprehensiveDsaCatalog.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Robust CSV parser that handles quoted strings with commas and escaped quotes
 */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    let title = ''
    let url = ''
    
    if (line.startsWith('"')) {
      const nextQuote = line.indexOf('",', 1)
      if (nextQuote !== -1) {
        title = line.substring(1, nextQuote).replace(/""/g, '"').trim()
        url = line.substring(nextQuote + 2).trim()
      } else {
        const parts = line.split(',')
        title = parts[0].replace(/"/g, '').trim()
        url = parts.slice(1).join(',').trim()
      }
    } else {
      const commaIdx = line.indexOf(',')
      if (commaIdx !== -1) {
        title = line.substring(0, commaIdx).trim()
        url = line.substring(commaIdx + 1).trim()
      } else {
        continue
      }
    }
    
    // Clean outer quotes from URL if any
    url = url.replace(/^"+|"+$/g, '').trim()
    if (url) {
      rows.push({ lineNum: i + 1, title, url })
    }
  }
  
  return rows
}

/**
 * Extracts platform, slug, and canonical URL from problem link
 */
function extractPlatformAndSlug(rawUrl) {
  let clean = rawUrl.trim().split('?')[0].replace(/\/+$/, '')
  let platform = 'other'
  let slug = ''
  let canonicalUrl = clean

  if (clean.includes('leetcode.com')) {
    platform = 'leetcode'
    const m = clean.match(/leetcode\.com\/problems\/([^/]+)/)
    slug = m ? m[1] : ''
    // Strip trailing subpaths like /description
    slug = slug.replace(/\/description$/, '')
    canonicalUrl = `https://leetcode.com/problems/${slug}/`
  } else if (clean.includes('geeksforgeeks.org')) {
    platform = 'geeksforgeeks'
    const m = clean.match(/geeksforgeeks\.org\/problems\/([^/]+)/)
    slug = m ? m[1] : ''
    canonicalUrl = `https://www.geeksforgeeks.org/problems/${slug}/1`
  } else if (clean.includes('interviewbit.com')) {
    platform = 'interviewbit'
    const m = clean.match(/interviewbit\.com\/problems\/([^/]+)/)
    slug = m ? m[1] : ''
    canonicalUrl = `https://www.interviewbit.com/problems/${slug}/`
  } else if (clean.includes('hackerrank.com')) {
    platform = 'hackerrank'
    const m = clean.match(/challenges\/([^/]+)/)
    slug = m ? m[1] : ''
    canonicalUrl = `https://www.hackerrank.com/challenges/${slug}/`
  } else if (clean.includes('onlinejudge.org')) {
    platform = 'other'
    slug = 'periodic-strings'
    canonicalUrl = 'https://onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=396'
  } else if (clean.includes('judge.yosupo.jp')) {
    platform = 'other'
    slug = 'number-of-substrings'
    canonicalUrl = 'https://judge.yosupo.jp/problem/number_of_substrings'
  }

  // Fallback slug extraction if regex didn't match
  if (!slug) {
    slug = clean.split('/').filter(Boolean).pop() || 'unknown-problem'
  }

  slug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '')

  return { platform, slug, canonicalUrl }
}

/**
 * Generates clean title from slug with proper casing and acronym formatting
 */
function titleFromSlug(slug) {
  // Strip trailing GFG timestamp IDs e.g. -1587115620, -141631, 0227, 4331
  let clean = slug.replace(/-\d{6,}$/, '').replace(/\d{4,}$/, '').replace(/--\d+$/, '')
  const acronyms = {
    bst: 'BST',
    lru: 'LRU',
    dp: 'DP',
    xor: 'XOR',
    lcs: 'LCS',
    kmp: 'KMP',
    '1d': '1D',
    '2d': '2D',
    '3d': '3D',
    ii: 'II',
    iii: 'III',
    iv: 'IV',
    v: 'V',
    vi: 'VI',
    vii: 'VII',
    gcd: 'GCD',
    lcm: 'LCM',
    bfs: 'BFS',
    dfs: 'DFS',
    trie: 'Trie',
    ncr: 'nCr',
  }

  return clean
    .split(/[-_]+/)
    .map(w => {
      const lower = w.toLowerCase()
      if (acronyms[lower]) return acronyms[lower]
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Resolves a high quality title given raw title and slug
 */
function resolveTitle(rawTitle, slug) {
  let t = (rawTitle || '')
    .replace(/^>\s*itself\s+/i, '')
    .replace(/^comes\s*\?\s*/i, '')
    .replace(/Link$/i, '')
    .trim()

  const slugTitle = titleFromSlug(slug)
  const slugWords = slugTitle.split(' ').length
  const tWords = t.split(' ').length

  // Fragment words that indicate partial scrapings
  const fragmentTitles = [
    'rotated',
    'difference',
    'range',
    'subarrays',
    'bank',
    'an array',
    'in string ii',
    'of it',
    'with hurdles',
    'than target',
    'exists with its negative',
    'absolute difference k',
  ]

  if (!t || t.length < 3) return slugTitle
  if (tWords === 1 && slugWords >= 2) return slugTitle
  if (fragmentTitles.includes(t.toLowerCase())) return slugTitle
  if (/^(than|with|in|of|an|the|is|and)\s+/i.test(t) && slugWords > tWords) return slugTitle

  return t
}

/**
 * Determines primary topic from URL, category param, slug, and title
 */
function inferTopic(title, url, slug) {
  const text = `${title} ${slug} ${url}`.toLowerCase()

  // 1. Explicit GFG/URL categories
  if (text.includes('category=bit%20magic') || text.includes('category=bit-magic')) return 'Bit Manipulation'
  if (text.includes('category=matrix')) return 'Arrays'
  if (text.includes('category=prefix-sum')) return 'Arrays'
  if (text.includes('category=linked-list')) return 'Linked Lists'
  if (text.includes('category=stack')) return 'Stacks'
  if (text.includes('category=queue')) return 'Queue'
  if (text.includes('category=tree')) return 'Trees'
  if (text.includes('category=bst')) return 'Binary Search Trees'
  if (text.includes('category=graph')) return 'Graph Traversal'
  if (text.includes('category=dynamic-programming') || text.includes('category=dp')) return 'Dynamic Programming'
  if (text.includes('category=greedy')) return 'Greedy'
  if (text.includes('category=backtracking')) return 'Backtracking'
  if (text.includes('category=binary-search')) return 'Binary Search'
  if (text.includes('category=two-pointer-algorithm')) return 'Two Pointers'
  if (text.includes('category=strings')) return 'Strings'

  // 2. Keyword matching
  if (text.includes('bst') || text.includes('binary search tree')) return 'Binary Search Trees'
  if (text.includes('trie')) return 'Tries'
  if (text.includes('segment tree') || text.includes('fenwick')) return 'Segment Trees'
  if (text.includes('tree') || text.includes('lca') || text.includes('inorder') || text.includes('preorder') || text.includes('postorder')) return 'Trees'
  if (text.includes('graph') || text.includes('bfs') || text.includes('dfs') || text.includes('dijkstra') || text.includes('topological') || text.includes('island') || text.includes('bipartite') || text.includes('cycle') || text.includes('course schedule')) return 'Graph Traversal'
  if (text.includes('dp') || text.includes('dynamic programming') || text.includes('knapsack') || text.includes('coin change') || text.includes('subsequence') || text.includes('lcs') || text.includes('edit distance') || text.includes('climbing stairs')) return 'Dynamic Programming'
  if (text.includes('bit') || text.includes('xor') || text.includes('binary string') || text.includes('power of 2') || text.includes('set bit') || text.includes('bleak')) return 'Bit Manipulation'
  if (text.includes('linked list') || text.includes('linkedlist') || (text.includes('node') && text.includes('list')) || text.includes('reverse a linked list')) return 'Linked Lists'
  if (text.includes('monotonic stack') || text.includes('next greater') || text.includes('daily temperatures') || text.includes('largest rectangle')) return 'Monotonic Stack'
  if (text.includes('stack') || text.includes('parenthes') || text.includes('postfix') || text.includes('prefix to')) return 'Stacks'
  if (text.includes('heap') || text.includes('priority queue') || text.includes('median') || text.includes('kth largest') || text.includes('kth smallest')) return 'Heaps'
  if (text.includes('sliding window') || text.includes('minimum window') || text.includes('max sum subarray of size k')) return 'Sliding Window'
  if (text.includes('two sum') || text.includes('3sum') || text.includes('two pointer') || text.includes('trapping rain') || text.includes('container with most water') || text.includes('sort colors')) return 'Two Pointers'
  if (text.includes('binary search') || text.includes('search a 2d matrix') || text.includes('rotated sorted') || text.includes('koko') || text.includes('peak element')) return 'Binary Search'
  if (text.includes('backtrack') || text.includes('n-queen') || text.includes('sudoku') || text.includes('permutation') || text.includes('combination sum') || text.includes('subset') || text.includes('rat in a maze')) return 'Backtracking'
  if (text.includes('greedy') || text.includes('activity selection') || text.includes('gas station') || text.includes('jump game') || text.includes('interval') || text.includes('fractional knapsack')) return 'Greedy'
  if (text.includes('string') || text.includes('anagram') || text.includes('palindrome') || text.includes('substring') || text.includes('word') || text.includes('roman') || text.includes('strstr')) return 'Strings'
  if (text.includes('matrix') || text.includes('grid') || text.includes('spiral') || text.includes('transpose')) return 'Arrays'
  if (text.includes('math') || text.includes('prime') || text.includes('factor') || text.includes('gcd') || text.includes('bulb') || text.includes('cmpl')) return 'Math'

  return 'Arrays'
}

/**
 * Determines problem difficulty
 */
function inferDifficulty(title, slug, url) {
  const text = `${title} ${slug} ${url}`.toLowerCase()

  // Explicit hard markers
  const hardKeywords = [
    'trapping-rain-water',
    'median-of-two-sorted-arrays',
    'n-queens',
    'sudoku',
    'word-ladder-ii',
    'merge-k-sorted',
    'sliding-window-maximum',
    'largest-rectangle-in-histogram',
    'longest-consecutive-sequence',
    'minimum-window-substring',
    'alien-dictionary',
    'hard',
  ]
  if (hardKeywords.some(k => text.includes(k))) return 'Hard'

  // Explicit easy markers
  const easyKeywords = [
    'two-sum',
    'running-sum',
    'valid-anagram',
    'reverse-string',
    'single-number',
    'missing-number',
    'power-of-two',
    'contains-duplicate',
    'merge-two-sorted-lists',
    'climbing-stairs',
    'max-sum-subarray-of-size-k',
    'second-largest',
    'equilibrium',
    'easy',
  ]
  if (easyKeywords.some(k => text.includes(k))) return 'Easy'

  return 'Medium'
}

/**
 * Helper to calculate estimated solve time based on difficulty
 */
function defaultEstimatedTime(difficulty) {
  switch (difficulty) {
    case 'Easy':
      return 15
    case 'Hard':
      return 45
    case 'Medium':
    default:
      return 25
  }
}

/**
 * Main Ingestion Function
 */
export async function ingestUserDsaQuestions() {
  console.log('=== Starting DSA Catalog User Sheet Ingestion ===')

  // 1. Read Raw CSV
  const csvPath = path.resolve(__dirname, '../data/user_raw_questions.csv')
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at: ${csvPath}`)
  }

  const rawCsv = fs.readFileSync(csvPath, 'utf8')
  const rows = parseCSV(rawCsv)
  console.log(`Parsed ${rows.length} rows from CSV file.`)

  // 2. Track existing items from initial curated catalog
  const existingSlugs = new Set()
  const existingUrls = new Set()
  const existingIds = new Set()

  function normalizeUrl(u) {
    if (!u) return ''
    return u.trim().split('?')[0].replace(/\/+$/, '').toLowerCase()
  }

  for (const p of initialCatalog) {
    existingSlugs.add(p.slug.toLowerCase())
    existingUrls.add(normalizeUrl(p.canonical_url))
    existingIds.add(p.id.toLowerCase())
  }
  console.log(`Loaded ${initialCatalog.length} existing problems from comprehensiveDsaCatalog.`)

  // 3. Process CSV entries with strict de-duplication
  const newlyAdded = []
  let duplicateCount = 0
  let existingMatchCount = 0

  for (const r of rows) {
    const { platform, slug, canonicalUrl } = extractPlatformAndSlug(r.url)
    const normSlug = slug.toLowerCase()
    const normUrl = normalizeUrl(canonicalUrl)

    // Platform ID prefix
    const prefix = platform === 'leetcode' ? 'lc' : platform === 'geeksforgeeks' ? 'gfg' : platform === 'interviewbit' ? 'ib' : platform === 'hackerrank' ? 'hr' : 'oth'
    const id = `${prefix}-${slug}`

    // Check against existing catalog
    if (existingSlugs.has(normSlug) || existingUrls.has(normUrl) || existingIds.has(id.toLowerCase())) {
      existingMatchCount++
      continue
    }

    // Check against newly added in this run (in-file duplicates)
    if (existingSlugs.has(normSlug) || existingUrls.has(normUrl)) {
      duplicateCount++
      continue
    }

    // Register as seen
    existingSlugs.add(normSlug)
    existingUrls.add(normUrl)
    existingIds.add(id.toLowerCase())

    const cleanTitle = resolveTitle(r.title, slug)
    const primaryTopic = inferTopic(r.title, r.url, slug)
    const difficulty = inferDifficulty(cleanTitle, slug, r.url)

    const problem = {
      id,
      platform,
      platform_problem_id: null,
      title: cleanTitle,
      slug,
      canonical_url: canonicalUrl,
      difficulty,
      primary_topic: primaryTopic,
      secondary_topics: JSON.stringify([primaryTopic]),
      patterns: JSON.stringify([]),
      is_free: 1,
      access_status: 'free',
      estimated_solve_time: defaultEstimatedTime(difficulty),
      acceptance_rate: null,
      source: 'user_problem_sheet',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    newlyAdded.push(problem)
  }

  console.log(`De-duplication summary:`)
  console.log(`  - Matched existing catalog items: ${existingMatchCount}`)
  console.log(`  - In-file duplicate rows skipped: ${duplicateCount}`)
  console.log(`  - Truly new unique questions to add: ${newlyAdded.length}`)

  // 4. Combine into final master catalog
  const mergedCatalog = [...initialCatalog, ...newlyAdded]
  console.log(`Total Master Catalog Size: ${mergedCatalog.length}`)

  // 5. Update comprehensiveDsaCatalog.js on disk so future seedings/hydrations have everything
  const catalogFilePath = path.resolve(__dirname, './comprehensiveDsaCatalog.js')
  const fileContent = `export const comprehensiveProblems = ${JSON.stringify(mergedCatalog, null, 2)}\n`
  fs.writeFileSync(catalogFilePath, fileContent, 'utf8')
  console.log(`Updated comprehensiveDsaCatalog.js with ${mergedCatalog.length} unique questions.`)

  // 6. Persist to SQLite Database
  const sqliteDb = getDatabase()
  const insertSqlite = sqliteDb.prepare(`
    INSERT INTO dsa_problems (
      id, platform, platform_problem_id, title, slug, canonical_url,
      difficulty, primary_topic, secondary_topics, patterns,
      is_free, access_status, estimated_solve_time, acceptance_rate, source,
      created_at, updated_at
    ) VALUES (
      @id, @platform, @platform_problem_id, @title, @slug, @canonical_url,
      @difficulty, @primary_topic, @secondary_topics, @patterns,
      @is_free, @access_status, @estimated_solve_time, @acceptance_rate, @source,
      @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      slug = excluded.slug,
      canonical_url = excluded.canonical_url,
      difficulty = excluded.difficulty,
      primary_topic = excluded.primary_topic,
      secondary_topics = excluded.secondary_topics,
      patterns = excluded.patterns,
      is_free = excluded.is_free,
      access_status = excluded.access_status,
      updated_at = excluded.updated_at
  `)

  const sqliteTransaction = sqliteDb.transaction((problems) => {
    let count = 0
    const now = new Date().toISOString()
    for (const p of problems) {
      insertSqlite.run({
        id: p.id,
        platform: p.platform || 'leetcode',
        platform_problem_id: p.platform_problem_id || null,
        title: p.title,
        slug: p.slug,
        canonical_url: p.canonical_url,
        difficulty: p.difficulty || 'Medium',
        primary_topic: p.primary_topic || 'Arrays',
        secondary_topics: typeof p.secondary_topics === 'string' ? p.secondary_topics : JSON.stringify(p.secondary_topics || []),
        patterns: typeof p.patterns === 'string' ? p.patterns : JSON.stringify(p.patterns || []),
        is_free: p.is_free !== undefined ? p.is_free : 1,
        access_status: p.access_status || 'free',
        estimated_solve_time: p.estimated_solve_time || 25,
        acceptance_rate: p.acceptance_rate || null,
        source: p.source || 'user_problem_sheet',
        created_at: p.created_at || now,
        updated_at: p.updated_at || now,
      })
      count++
    }
    return count
  })

  const sqlitePersistedCount = sqliteTransaction(mergedCatalog)
  console.log(`[SQLite] Successfully synced ${sqlitePersistedCount} questions into dsa_problems.`)

  // Check SQLite for any duplicates
  const dupCheckSqlite = sqliteDb.prepare(`
    SELECT slug, count(*) as c FROM dsa_problems GROUP BY slug HAVING count(*) > 1
  `).all()
  if (dupCheckSqlite.length > 0) {
    console.error(`WARNING: Found ${dupCheckSqlite.length} duplicate slugs in SQLite:`, dupCheckSqlite)
  } else {
    console.log(`[SQLite Integrity Check Passed] Zero duplicate slugs found!`)
  }

  // 7. Persist to MongoDB Atlas
  console.log('[MongoDB Atlas] Connecting to cluster for cloud sync...')
  await connectMongo()
  if (isMongoConnected()) {
    console.log('[MongoDB Atlas] Connected. Bulk upserting all questions...')
    
    const bulkOps = mergedCatalog.map(p => ({
      updateOne: {
        filter: { id: p.id },
        update: {
          $set: {
            _id: p.id,
            id: p.id,
            platform: p.platform,
            platform_problem_id: p.platform_problem_id || null,
            title: p.title,
            slug: p.slug,
            canonical_url: p.canonical_url,
            difficulty: p.difficulty,
            primary_topic: p.primary_topic,
            secondary_topics: Array.isArray(p.secondary_topics) ? p.secondary_topics : JSON.parse(p.secondary_topics || '[]'),
            patterns: Array.isArray(p.patterns) ? p.patterns : JSON.parse(p.patterns || '[]'),
            is_free: p.is_free !== undefined ? p.is_free : 1,
            access_status: p.access_status || 'free',
            estimated_solve_time: p.estimated_solve_time || 25,
            acceptance_rate: p.acceptance_rate || null,
            source: p.source || 'user_problem_sheet',
            created_at: p.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        },
        upsert: true
      }
    }))

    const bulkResult = await DsaProblemModel.bulkWrite(bulkOps)
    console.log(`[MongoDB Atlas] Bulk write complete. Matched: ${bulkResult.matchedCount}, Upserted: ${bulkResult.upsertedCount}, Modified: ${bulkResult.modifiedCount}`)

    const mongoTotal = await DsaProblemModel.countDocuments()
    console.log(`[MongoDB Atlas] Total problems currently in cloud collection: ${mongoTotal}`)
  } else {
    console.warn('[MongoDB Atlas] Not connected. Cloud sync skipped.')
  }

  return {
    initialCount: initialCatalog.length,
    newlyAddedCount: newlyAdded.length,
    totalCount: mergedCatalog.length,
    duplicateRowsSkipped: duplicateCount,
    existingRowsMatched: existingMatchCount,
  }
}

// Run immediately if executed directly via node
if (process.argv[1] && process.argv[1].endsWith('ingestUserDsaQuestions.js')) {
  ingestUserDsaQuestions()
    .then((result) => {
      console.log('Ingestion completed successfully:', result)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Ingestion failed with error:', err)
      process.exit(1)
    })
}
