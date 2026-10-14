import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Robust JSON loader that checks multiple relative locations for portfolio_data.json
 */
export function getPortfolioDataFallback() {
  const candidatePaths = [
    path.resolve(__dirname, '../data/portfolio_data.json'),
    path.resolve(__dirname, '../../../client/src/data/portfolio_data.json'),
    path.resolve(__dirname, '../../data/portfolio_data.json'),
    path.resolve(process.cwd(), 'client/src/data/portfolio_data.json'),
    path.resolve(process.cwd(), '../client/src/data/portfolio_data.json'),
    path.resolve(process.cwd(), 'src/data/portfolio_data.json'),
  ]

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf8')
        return JSON.parse(raw)
      }
    } catch (err) {
      console.warn(`[Seed] Error reading candidate ${candidate}:`, err.message)
    }
  }

  // Guaranteed embedded fallback if no JSON file exists on disk
  return {
    personal: {
      name: "Manash Swain",
      role: "AI Automation & Full-Stack Engineer",
      location: "Bangalore, India",
      headline: "I build web apps and AI agents you can trust.",
      sub: "Full-Stack & AI Automation · BITS Pilani CS · Bangalore",
      about: [
        "I got into computers because I wanted to understand how things actually work — not just how to use them. That curiosity led me to build things end to end: from the database schema to the API contract to the UI that talks to both.",
        "Lately, that curiosity has pulled me toward agentic AI. The question that keeps me up: how do you give an LLM real power without letting it make irreversible mistakes? My project Gatekeeper is my answer so far — the model proposes, a rules engine decides. Zero hallucinated executions on critical actions.",
        "I learn project-first. Every meaningful insight I have came from shipping something and hitting a wall I had to actually climb."
      ],
      now: {
        building: "AI agent systems that combine LLMs with deterministic control",
        learning: "Agentic workflows, structured outputs, and tool-use patterns",
        openTo: "AI Automation, Backend, or Full-Stack internships"
      },
      education: [
        {
          institute: "BITS Pilani",
          degree: "BS in Computer Science",
          duration: "2025 - 2028",
          logo: "/bitsPilaniLogo.png"
        }
      ]
    },
    skills: {
      ai: {
        label: "AI Automation",
        tagline: "LLMs propose. Rules decide.",
        items: ["Anthropic / Claude API", "Tool Use & Function Calling", "Pydantic Structured Outputs", "Agentic Workflow Design", "Rule-Based Gating", "Prompt Engineering", "FastAPI"]
      },
      web: {
        label: "Full-Stack Web",
        tagline: "From schema to UI, end to end.",
        items: ["React", "Node.js / Express", "MongoDB", "REST API Design", "JWT Auth", "TailwindCSS", "Next.js"]
      },
      data: {
        label: "Data & Tools",
        tagline: "Numbers tell the story.",
        items: ["Python", "Pandas / NumPy", "SQL (joins, CTEs, windows)", "Git & GitHub", "Vercel / Render"]
      }
    },
    stats: {
      leetcode_fallback: 95,
      gfg_fallback: 174,
      projects: 4
    },
    activity_events: [
      {
        date: "2026-10-13",
        category: "failed",
        title: "Failed DSA Interview",
        description: "5 questions ranging from recursion to dynamic programming."
      },
      {
        date: "2026-10-14",
        category: "rejected",
        title: "Application rejected at IBM",
        description: "Applied for AI Intern position and got rejected."
      }
    ],
    projects: [
      {
        title: "Safe NL-to-SQL",
        category: "AI / Automation",
        short_description: "Deterministic natural language to SQL assistant with AST safety validation, Human-in-the-Loop checkpoints, and sandboxed execution.",
        outcome: "100% blocked destructive queries & schema drops. Stateful human approval workflow with 22/22 tests passing.",
        problem: "Traditional Text-to-SQL tools are vulnerable black boxes where LLMs can hallucinate table names, omit WHERE clauses, or execute catastrophic DDL drops directly on live production databases.",
        architecture: "LangGraph state machine integrating intent taxonomy classification, ambiguity clarification, schema-grounded SQL generation (Groq Llama 3.3 70B), deterministic AST safety validation, and an isolated SQLite sandbox.",
        key_challenge: "Enforcing zero-tolerance deterministic safety against catastrophic operations (DROP, ALTER, unbounded UPDATE/DELETE) while preserving conversational flow and enabling human intervention.",
        solution: "Decoupled LLM generation from safety enforcement: sqlparse AST validator enforces fail-closed policies, while LangGraph persists thread state to SQLite checkpointers to pause execution for human review and in-browser SQL editing.",
        metrics: ["100% Blocked DDL Mutations", "Stateful HITL Checkpoints", "22 Automated Tests Passing"],
        techStack: ["LangGraph", "FastAPI", "Python", "React 19", "SQLite", "TailwindCSS"],
        liveLink: "https://sqlwriter.vercel.app",
        githubLink: "https://github.com/Manash2005/sql-writer",
        image: "/projects/sql-writer.png",
        featured: true,
        reflection: "LLMs should propose queries, but deterministic AST verification and human checkpoints must govern database execution."
      },
      {
        title: "Gatekeeper",
        category: "AI / Automation",
        short_description: "A secure AI agent workflow — the LLM proposes, a rules engine decides. 0% hallucinated executions.",
        outcome: "0% hallucinated execution rate on critical actions. 99% structured-output parse success.",
        problem: "Fully autonomous LLM agents hallucinate. Giving them direct access to execute critical actions (payments, DB deletes) is a security risk.",
        architecture: "Multi-layered agent system: LLM proposes actions via Tool Use, a deterministic rules-engine validates all parameters before execution.",
        key_challenge: "Ensuring the LLM outputs structured, perfectly formatted data that the rule engine could parse without crashing.",
        solution: "Anthropic's Claude API with strict Pydantic schemas to force structured JSON outputs, combined with a retry-loop for self-correction.",
        metrics: ["0% Hallucinated Executions", "99% Parse Success Rate"],
        techStack: ["Python", "FastAPI", "Anthropic API", "Pydantic", "Agentic Design"],
        liveLink: "https://revenue-recovery-jet.vercel.app/",
        githubLink: "https://github.com/Manash2005/revenue_recovery",
        image: "/projects/gatekeeper.png",
        featured: true,
        reflection: "Combining deterministic code with probabilistic AI yields the safest production systems."
      },
      {
        title: "TaskFlow",
        category: "Full-Stack Web",
        short_description: "Full-stack task manager with Kanban boards, real-time analytics, and user auth.",
        outcome: "Sub-100ms UI response with zero-latency feel and robust data persistence.",
        problem: "Teams struggle to track project progress without complex enterprise tools.",
        architecture: "React state synchronized with Express/MongoDB backend. JWT session management.",
        key_challenge: "Smooth drag-and-drop Kanban with optimistic UI updates synced flawlessly to backend.",
        solution: "State synchronization layer that locally updates the board instantly, falling back gracefully if the API request fails.",
        metrics: ["Sub-100ms UI response", "Full CRUD with auth"],
        techStack: ["React", "Node.js", "Express", "MongoDB", "TailwindCSS"],
        liveLink: "https://task-manager-phi-five-12.vercel.app/",
        githubLink: "https://github.com/Manash2005/taskManager",
        image: "/projects/taskflow.png",
        featured: true,
        reflection: "I'd implement WebSockets for true multi-player collaboration if I rebuilt this today."
      },
      {
        title: "Socially",
        category: "Full-Stack Web",
        short_description: "Private organizational social network with department-level restricted channels.",
        outcome: "Highly secure, performant feed. Security enforced at the database layer via RLS.",
        problem: "Organizations need a secure internal way to share updates without public social media.",
        architecture: "React frontend integrated with Supabase BaaS, utilizing Row Level Security (RLS) policies.",
        key_challenge: "Database schema that strictly enforced viewing permissions based on department and role.",
        solution: "Supabase PostgreSQL RLS policies — users can only query posts belonging to their authorized channels.",
        metrics: ["Secure RLS Policies", "Real-time feed updates"],
        techStack: ["React", "Node.js", "Supabase", "TailwindCSS"],
        liveLink: "https://socially.vercel.app",
        githubLink: "",
        image: "/projects/socially.png",
        featured: true,
        reflection: "Pushing security down to the database layer is more robust than handling it all in application logic."
      }
    ],
    contact: {
      email: "swainm099@gmail.com",
      github: "https://github.com/Manash2005",
      linkedin: "https://www.linkedin.com/in/manash-swain",
      resume_url: "/resume.pdf"
    }
  }
}

/**
 * Synchronous seed function that populates goals, projects, initial events, and portfolio content.
 * Safe and idempotent: Uses INSERT OR IGNORE / ON CONFLICT to never overwrite existing custom records.
 */
export function seedInitialData(db) {
  if (!db) {
    throw new Error('Database instance is required for seedInitialData')
  }

  const data = getPortfolioDataFallback()

  const seedTransaction = db.transaction(() => {
    // 1. Seed Goals
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

    // 2. Seed Projects
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects (
        id, title, description, short_description, outcome, problem,
        architecture, key_challenge, solution, metrics, category, status,
        tech_stack, live_link, github_link, image, featured, reflection,
        is_published, display_order, goal_id
      ) VALUES (
        @id, @title, @description, @short_description, @outcome, @problem,
        @architecture, @key_challenge, @solution, @metrics, @category, @status,
        @tech_stack, @live_link, @github_link, @image, @featured, @reflection,
        @is_published, @display_order, @goal_id
      )
    `)

    if (data?.projects && Array.isArray(data.projects)) {
      data.projects.forEach((proj, idx) => {
        const id = 'proj_' + (proj.title || `project_${idx}`).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32)
        let goalId = 'goal_projects_shipping'
        if (proj.category?.includes('AI')) goalId = 'goal_ai_eng'

        insertProject.run({
          id,
          title: proj.title,
          description: proj.short_description || proj.problem || '',
          short_description: proj.short_description || '',
          outcome: proj.outcome || '',
          problem: proj.problem || '',
          architecture: proj.architecture || '',
          key_challenge: proj.key_challenge || '',
          solution: proj.solution || '',
          metrics: JSON.stringify(proj.metrics || []),
          category: proj.category || 'AI / Automation',
          status: 'completed',
          tech_stack: JSON.stringify(proj.techStack || []),
          live_link: proj.liveLink || null,
          github_link: proj.githubLink || null,
          image: proj.image || null,
          featured: proj.featured ? 1 : 0,
          reflection: proj.reflection || '',
          is_published: 1,
          display_order: idx,
          goal_id: goalId,
        })
      })
    }

    // 3. Seed Events
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

    // Activity events from portfolio data
    if (data?.activity_events && Array.isArray(data.activity_events)) {
      data.activity_events.forEach((evt, idx) => {
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
          status: 'Completed',
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

    // Canonical initial events
    const canonicalEvents = [
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
        project_id: null,
        private_notes: 'RRF with k=60 showed a 14% improvement in retrieval precision on technical documents.',
      },
    ]

    for (const evt of canonicalEvents) {
      insertEvent.run(evt)
    }

    // 4. Seed dynamic portfolio_content table if empty
    const insertContent = db.prepare(`
      INSERT OR IGNORE INTO portfolio_content (section_key, content_json, updated_at)
      VALUES (?, ?, datetime('now'))
    `)

    if (data?.personal) {
      insertContent.run('personal', JSON.stringify(data.personal))
    }
    if (data?.skills) {
      insertContent.run('skills', JSON.stringify(data.skills))
    }
    if (data?.contact) {
      insertContent.run('contact', JSON.stringify(data.contact))
    }
  })

  seedTransaction()
  console.log('[Seed] Database successfully seeded with goals, projects, events, and portfolio content.')
}
