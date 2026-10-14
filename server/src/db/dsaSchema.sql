-- DSA Training Arena Database Schema (SQLite)
-- Version: 1.0.0

PRAGMA foreign_keys = ON;

-- 1. Master Question Bank
CREATE TABLE IF NOT EXISTS dsa_problems (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL, -- 'leetcode', 'geeksforgeeks'
  platform_problem_id TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  canonical_url TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'Easy', 'Medium', 'Hard'
  primary_topic TEXT NOT NULL,
  secondary_topics TEXT, -- JSON array of strings
  patterns TEXT, -- JSON array of strings, e.g. '["Two Pointers", "Sliding Window"]'
  is_free INTEGER NOT NULL DEFAULT 1, -- 1 = free, 0 = premium/restricted
  access_status TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium', 'unknown'
  estimated_solve_time INTEGER DEFAULT 20, -- minutes
  acceptance_rate REAL,
  source TEXT DEFAULT 'curated_catalog',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dsa_problems_topic ON dsa_problems(primary_topic);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_diff ON dsa_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_platform ON dsa_problems(platform);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_free ON dsa_problems(is_free);

-- 2. Solving History and Practice Attempts
CREATE TABLE IF NOT EXISTS dsa_attempts (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TEXT,
  ended_at TEXT,
  duration_seconds INTEGER, -- explicit timer duration in seconds (NULL for imported)
  result TEXT NOT NULL, -- 'solved', 'attempted_unsolved', 'timed_out', 'abandoned', 'reviewed'
  is_independent INTEGER NOT NULL DEFAULT 1, -- 1 = independent, 0 = used hints or viewed solution
  hints_used INTEGER NOT NULL DEFAULT 0,
  solution_viewed INTEGER NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'Java',
  confidence_rating INTEGER DEFAULT 3, -- 1 to 5
  difficulty_experienced TEXT, -- 'easy', 'medium', 'hard', 'brutal'
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'practice_arena', -- 'practice_arena', 'manual_log', 'leetcode_sync', 'gfg_sync'
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  calendar_event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dsa_attempts_problem ON dsa_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_dsa_attempts_result ON dsa_attempts(result);
CREATE INDEX IF NOT EXISTS idx_dsa_attempts_created ON dsa_attempts(created_at);

-- 3. Mistake Journal (Categorized Coding Errors)
CREATE TABLE IF NOT EXISTS dsa_mistake_journal (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
  attempt_id TEXT REFERENCES dsa_attempts(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'conceptual_gap', 'pattern_recognition', 'implementation_bug', 'complexity_analysis', 'edge_cases', 'language_syntax', 'time_management', 'careless_error'
  mistake_description TEXT NOT NULL,
  lesson_learned TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dsa_mistakes_problem ON dsa_mistake_journal(problem_id);
CREATE INDEX IF NOT EXISTS idx_dsa_mistakes_category ON dsa_mistake_journal(category);

-- 4. Spaced Repetition Revision Scheduler
CREATE TABLE IF NOT EXISTS dsa_revision_schedule (
  problem_id TEXT PRIMARY KEY REFERENCES dsa_problems(id) ON DELETE CASCADE,
  last_solved_at TEXT NOT NULL,
  next_revision_due TEXT NOT NULL, -- YYYY-MM-DD
  interval_days INTEGER NOT NULL DEFAULT 3,
  repetition_count INTEGER NOT NULL DEFAULT 1,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  status TEXT NOT NULL DEFAULT 'due', -- 'due', 'upcoming', 'mastered'
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dsa_revision_due ON dsa_revision_schedule(next_revision_due, status);

-- 5. Gamification Profile (XP, Levels, Streaks, Penalties)
CREATE TABLE IF NOT EXISTS dsa_game_profile (
  id TEXT PRIMARY KEY DEFAULT 'primary_user',
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'Novice',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT, -- YYYY-MM-DD
  streak_freeze_count INTEGER NOT NULL DEFAULT 2,
  penalties_enabled INTEGER NOT NULL DEFAULT 0, -- 0 = fair/off, 1 = on
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. Achievements Catalog & Unlocks
CREATE TABLE IF NOT EXISTS dsa_achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'solving', 'streak', 'mastery', 'revision', 'special'
  badge_icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  is_unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT
);

-- 7. Daily Practice Plans
CREATE TABLE IF NOT EXISTS dsa_daily_plans (
  id TEXT PRIMARY KEY,
  plan_date TEXT NOT NULL, -- YYYY-MM-DD
  duration_budget_minutes INTEGER NOT NULL DEFAULT 45,
  summary TEXT,
  items_json TEXT NOT NULL, -- JSON array of { problem_id, reason, activity_type, status, estimated_minutes }
  generated_by TEXT NOT NULL DEFAULT 'deterministic', -- 'ai_groq', 'ai_openrouter', 'deterministic'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'partial'
  calendar_event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dsa_plans_date ON dsa_daily_plans(plan_date);

-- 8. AI Coach Request & Audit Logs
CREATE TABLE IF NOT EXISTS dsa_ai_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL, -- 'daily_plan', 'weak_topic_analysis', 'recommendations', 'mistake_review'
  provider TEXT NOT NULL, -- 'groq', 'openrouter', 'deterministic_fallback'
  model TEXT,
  prompt_summary TEXT,
  response_json TEXT,
  latency_ms INTEGER,
  success INTEGER NOT NULL DEFAULT 1,
  error_category TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
