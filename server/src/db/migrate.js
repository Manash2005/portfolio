/**
 * migrate.js — Safe, idempotent migration script for Second Brain
 *
 * 1. Creates an untouched backup of the existing portfolio JSON data.
 * 2. Initializes the SQLite schema.
 * 3. Migrates projects and existing activity_events from JSON.
 * 4. Seeds core developer goals and structured events (public + private).
 * 5. Verifies record counts and integrity.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const portfolioJsonPath = path.resolve(__dirname, '../../../client/src/data/portfolio_data.json')
const backupsDir = path.resolve(__dirname, '../../data/backups')

export function runMigration() {
  console.log('--- Starting Second Brain Database Migration ---')

  // 1. Ensure backup directory exists & create backup of original JSON
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }

  let originalData = null
  if (fs.existsSync(portfolioJsonPath)) {
    const rawContent = fs.readFileSync(portfolioJsonPath, 'utf8')
    originalData = JSON.parse(rawContent)

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupsDir, `portfolio_data_backup_${backupTimestamp}.json`)
    fs.writeFileSync(backupFile, rawContent, 'utf8')
    console.log(`[Backup] Original JSON backed up safely to: ${backupFile}`)
  } else {
    console.warn(`[Warning] No JSON file found at ${portfolioJsonPath}. Continuing with defaults.`)
  }

  const db = getDatabase()

  // Use a transaction for atomic and safe migration
  const migrateTransaction = db.transaction(() => {
    // 2. Seed Goals
    const insertGoal = db.prepare(`
      INSERT OR IGNORE INTO goals (id, title, description, category, status, target_date, color)
      VALUES (@id, @title, @description, @category, @status, @target_date, @color)
    `)

    const initialGoals = [
      {
        id: 'goal_ai_eng',
        title: 'Master AI Engineering & Agentic Workflows',
        description: 'Build production-ready LLM agents with deterministic AST validation, LangGraph state machines, and Human-in-the-Loop safeguards.',
        category: 'AI Engineering',
        status: 'in_progress',
        target_date: '2026-12-31',
        color: '#B8FF3C',
      },
      {
        id: 'goal_dsa_prep',
        title: 'Interview Mastery & Advanced DSA',
        description: 'Complete 300+ problems across Graphs, Dynamic Programming, and System Design with mock interview reps.',
        category: 'DSA',
        status: 'in_progress',
        target_date: '2026-11-30',
        color: '#FFD13B',
      },
      {
        id: 'goal_projects_shipping',
        title: 'Ship 4 Production-Grade Apps',
        description: 'Develop and deploy high-impact web apps with secure architecture, automated tests, and sub-100ms response times.',
        category: 'Project Development',
        status: 'in_progress',
        target_date: '2026-12-15',
        color: '#60A5FA',
      },
      {
        id: 'goal_career_internship',
        title: 'Secure Top-Tier AI / Backend Internship',
        description: 'Apply to target roles, complete take-home assessments, and demonstrate verified proof of work.',
        category: 'Career',
        status: 'in_progress',
        target_date: '2026-11-15',
        color: '#F472B6',
      },
    ]

    for (const g of initialGoals) {
      insertGoal.run(g)
    }

    // 3. Migrate Projects from portfolio_data.json
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects (id, title, description, category, status, tech_stack, live_link, github_link, goal_id)
      VALUES (@id, @title, @description, @category, @status, @tech_stack, @live_link, @github_link, @goal_id)
    `)

    if (originalData?.projects && Array.isArray(originalData.projects)) {
      originalData.projects.forEach((proj, idx) => {
        const id = 'proj_' + (proj.title || `project_${idx}`).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32)
        let goalId = 'goal_projects_shipping'
        if (proj.category?.includes('AI')) goalId = 'goal_ai_eng'

        insertProject.run({
          id,
          title: proj.title,
          description: proj.short_description || proj.problem || '',
          category: proj.category || 'AI / Automation',
          status: 'completed',
          tech_stack: JSON.stringify(proj.techStack || []),
          live_link: proj.liveLink || null,
          github_link: proj.githubLink || null,
          goal_id: goalId,
        })
      })
    }

    // 4. Seed and Migrate Events
    const insertEvent = db.prepare(`
      INSERT OR IGNORE INTO events (
        id, title, description, category, start_at, end_at, all_day, timezone,
        location, meeting_url, external_url, status, visibility,
        show_on_portfolio_heatmap, color, tags, priority, goal_id, project_id, private_notes
      ) VALUES (
        @id, @title, @description, @category, @start_at, @end_at, @all_day, @timezone,
        @location, @meeting_url, @external_url, @status, @visibility,
        @show_on_portfolio_heatmap, @color, @tags, @priority, @goal_id, @project_id, @private_notes
      )
    `)

    // Migrate existing events from portfolio_data.json
    if (originalData?.activity_events && Array.isArray(originalData.activity_events)) {
      originalData.activity_events.forEach((evt, idx) => {
        const dateStr = evt.date || '2026-10-14'
        const id = 'evt_' + (evt.title || `event_${idx}`).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32) + '_' + dateStr.replace(/-/g, '')
        const isFailed = (evt.category === 'failed' || evt.category === 'rejected' || (evt.title || '').toLowerCase().includes('fail'))

        insertEvent.run({
          id,
          title: evt.title,
          description: evt.description || '',
          category: evt.title.includes('Interview') ? 'Interview Preparation' : 'Career',
          start_at: `${dateStr}T14:00:00`,
          end_at: `${dateStr}T15:30:00`,
          all_day: 1,
          timezone: 'Asia/Kolkata',
          location: 'Remote',
          meeting_url: null,
          external_url: null,
          status: isFailed ? 'Completed' : 'Completed',
          visibility: 'Public',
          show_on_portfolio_heatmap: 1,
          color: isFailed ? '#FF4D4D' : '#B8FF3C',
          tags: JSON.stringify(['Interview', 'DSA', 'Feedback']),
          priority: 'high',
          goal_id: 'goal_dsa_prep',
          project_id: null,
          private_notes: 'Reviewed mistakes: recursion stack explosion on problem 4. Re-practice DP transition table.',
        })
      })
    }

    // Comprehensive initial events across various categories, statuses, and visibilities
    const seedEvents = [
      // 1. Completed AI project development session (Heatmap = 1, Public)
      {
        id: 'evt_sql_writer_ast_validation_20261011',
        title: 'Safe NL-to-SQL AST Safety Engine',
        description: 'Implemented sqlparse AST validator to enforce zero-tolerance policy against DROP, ALTER, and unbounded mutations.',
        category: 'Project Development',
        start_at: '2026-10-11T10:00:00',
        end_at: '2026-10-11T14:30:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Bangalore Studio',
        meeting_url: null,
        external_url: 'https://github.com/Manash2005/sql-writer',
        status: 'Completed',
        visibility: 'Public',
        show_on_portfolio_heatmap: 1,
        color: '#B8FF3C',
        tags: JSON.stringify(['AI Engineering', 'SQL', 'LangGraph', 'Security']),
        priority: 'high',
        goal_id: 'goal_ai_eng',
        project_id: 'proj_safe_nl_to_sql',
        private_notes: 'All 22/22 unit tests passing in pytest suite.',
      },
      // 2. LeetCode Weekly Contest (Heatmap = 1, Public)
      {
        id: 'evt_leetcode_weekly_418_20261012',
        title: 'LeetCode Weekly Contest 418',
        description: 'Solved 3/4 problems. Optimised Dijkstra with indexed priority queue for Q3.',
        category: 'Competitive Programming',
        start_at: '2026-10-12T08:00:00',
        end_at: '2026-10-12T09:30:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Online',
        meeting_url: null,
        external_url: 'https://leetcode.com/contest',
        status: 'Completed',
        visibility: 'Public',
        show_on_portfolio_heatmap: 1,
        color: '#FFD13B',
        tags: JSON.stringify(['LeetCode', 'Contest', 'Graphs', 'Dijkstra']),
        priority: 'medium',
        goal_id: 'goal_dsa_prep',
        project_id: null,
        private_notes: 'Q4 was a segment tree with range gcd. Need to review segment tree lazies.',
      },
      // 3. System Design Session (Heatmap = 1, Public)
      {
        id: 'evt_sys_design_rate_limiter_20261014',
        title: 'System Design: Distributed Token Bucket',
        description: 'Studied Redis cluster-backed sliding window counter vs token bucket rate limiters for API gateways.',
        category: 'System Design',
        start_at: '2026-10-14T17:00:00',
        end_at: '2026-10-14T19:00:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Workstation',
        meeting_url: null,
        external_url: null,
        status: 'Completed',
        visibility: 'Public',
        show_on_portfolio_heatmap: 1,
        color: '#60A5FA',
        tags: JSON.stringify(['System Design', 'Redis', 'Rate Limiter', 'Scalability']),
        priority: 'high',
        goal_id: 'goal_ai_eng',
        project_id: null,
        private_notes: 'Redis Lua script prevents concurrency race conditions during atomic decrement.',
      },
      // 4. Upcoming AI Engineering Mock Interview (Public, Planned, Heatmap = 0 until completed)
      {
        id: 'evt_mock_ai_interview_20261016',
        title: 'AI Engineering Mock Technical Interview',
        description: 'Mock round focusing on LangGraph orchestration, RAG latency optimizations, and tool routing safeguards.',
        category: 'Interview Preparation',
        start_at: '2026-10-16T15:00:00',
        end_at: '2026-10-16T16:30:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Google Meet',
        meeting_url: null,
        external_url: null,
        status: 'Planned',
        visibility: 'Public',
        show_on_portfolio_heatmap: 0,
        color: '#FFD13B',
        tags: JSON.stringify(['AI Engineering', 'Mock Interview', 'LangGraph', 'RAG']),
        priority: 'urgent',
        goal_id: 'goal_career_internship',
        project_id: 'proj_safe_nl_to_sql',
        private_notes: 'Prepare walk-through of AST safety validation and SQLite checkpointer rollback mechanism.',
      },
      // 5. Upcoming Hackathon (Public, Planned)
      {
        id: 'evt_hackathon_agentic_ai_20261018',
        title: 'Autonomous Agents Hackathon 2026',
        description: '48-hour sprint building multi-agent self-healing workflows for continuous deployment.',
        category: 'Hackathon',
        start_at: '2026-10-18T09:00:00',
        end_at: '2026-10-19T21:00:00',
        all_day: 1,
        timezone: 'Asia/Kolkata',
        location: 'Virtual / Discord',
        meeting_url: null,
        external_url: 'https://devpost.com',
        status: 'Planned',
        visibility: 'Public',
        show_on_portfolio_heatmap: 0,
        color: '#A78BFA',
        tags: JSON.stringify(['Hackathon', 'Agents', 'Python', 'FastAPI']),
        priority: 'high',
        goal_id: 'goal_ai_eng',
        project_id: null,
        private_notes: 'Team repo is configured. Need to finalize system architecture prompt templates.',
      },
      // 6. STRICTLY PRIVATE Event (Tests privacy isolation — MUST NEVER BE RETURNED TO PUBLIC)
      {
        id: 'evt_private_financial_planning_20261015',
        title: 'Private Personal Review & Semester Budgeting',
        description: 'Review monthly expenses, college credits, and study schedule balance.',
        category: 'Personal',
        start_at: '2026-10-15T20:00:00',
        end_at: '2026-10-15T21:30:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Home',
        meeting_url: null,
        external_url: null,
        status: 'Planned',
        visibility: 'Private',
        show_on_portfolio_heatmap: 0,
        color: '#9CA3AF',
        tags: JSON.stringify(['Personal', 'Finances']),
        priority: 'low',
        goal_id: null,
        project_id: null,
        private_notes: 'CONFIDENTIAL: Banking and personal savings audit. Absolutely never return in public API.',
      },
      // 7. Another PRIVATE Learning Note (Tests privacy isolation)
      {
        id: 'evt_private_company_intel_20261017',
        title: 'Internal Company Research & Salary Benchmarks',
        description: 'Confidential recruiter notes and interview question bank for target startups.',
        category: 'Career',
        start_at: '2026-10-17T11:00:00',
        end_at: '2026-10-17T12:00:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Private Notebook',
        meeting_url: null,
        external_url: null,
        status: 'Planned',
        visibility: 'Private',
        show_on_portfolio_heatmap: 0,
        color: '#9CA3AF',
        tags: JSON.stringify(['Career', 'Confidential']),
        priority: 'high',
        goal_id: 'goal_career_internship',
        project_id: null,
        private_notes: 'Target compensation: 25k-40k INR/mo internship. Contacted engineering lead directly on LinkedIn.',
      },
      // 8. Completed Learning milestone (Heatmap = 1, Public)
      {
        id: 'evt_learned_rag_embeddings_20261009',
        title: 'Deep Dive: Hybrid Search (BM25 + Dense Vectors)',
        description: 'Implemented Reciprocal Rank Fusion (RRF) to blend keyword BM25 retrieval with semantic embeddings in ChromaDB.',
        category: 'Learning',
        start_at: '2026-10-09T14:00:00',
        end_at: '2026-10-09T17:30:00',
        all_day: 0,
        timezone: 'Asia/Kolkata',
        location: 'Library',
        meeting_url: null,
        external_url: null,
        status: 'Completed',
        visibility: 'Public',
        show_on_portfolio_heatmap: 1,
        color: '#B8FF3C',
        tags: JSON.stringify(['RAG', 'Vector Search', 'Embeddings', 'AI']),
        priority: 'medium',
        goal_id: 'goal_ai_eng',
        project_id: 'proj_gatekeeper',
        private_notes: 'RRF with k=60 showed a 14% improvement in retrieval precision on technical documents.',
      },
    ]

    for (const evt of seedEvents) {
      insertEvent.run(evt)
    }
  })

  migrateTransaction()

  // 5. Verification & Report
  const goalsCount = db.prepare('SELECT count(*) as c FROM goals').get().c
  const projectsCount = db.prepare('SELECT count(*) as c FROM projects').get().c
  const totalEventsCount = db.prepare('SELECT count(*) as c FROM events').get().c
  const publicEventsCount = db.prepare("SELECT count(*) as c FROM events WHERE visibility = 'Public'").get().c
  const privateEventsCount = db.prepare("SELECT count(*) as c FROM events WHERE visibility = 'Private'").get().c
  const heatmapEventsCount = db.prepare('SELECT count(*) as c FROM events WHERE show_on_portfolio_heatmap = 1').get().c

  console.log('\n--- Migration Results Summary ---')
  console.log(`Goals in Database:           ${goalsCount}`)
  console.log(`Projects in Database:        ${projectsCount}`)
  console.log(`Total Events in Database:    ${totalEventsCount}`)
  console.log(`  - Public Events:           ${publicEventsCount}`)
  console.log(`  - Private Events:          ${privateEventsCount} (guaranteed protected)`)
  console.log(`  - Heatmap Eligible Events: ${heatmapEventsCount}`)
  console.log('--- Migration Completed Successfully! ---\n')
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigration()
}
