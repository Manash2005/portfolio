-- Second Brain Database Schema (SQLite)
-- Version: 1.0.0

PRAGMA foreign_keys = ON;

-- 1. Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'AI Engineering',
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'planned', 'in_progress', 'completed'
  target_date TEXT,
  color TEXT DEFAULT '#B8FF3C',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'AI / Automation',
  status TEXT NOT NULL DEFAULT 'active', -- 'planned', 'active', 'completed'
  tech_stack TEXT, -- JSON array of strings
  live_link TEXT,
  github_link TEXT,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Learning',
  start_at TEXT NOT NULL, -- ISO 8601 string, e.g. '2026-10-14T10:00:00'
  end_at TEXT NOT NULL,   -- ISO 8601 string, e.g. '2026-10-14T11:30:00'
  all_day INTEGER NOT NULL DEFAULT 0, -- 1 = all day, 0 = timed
  timezone TEXT DEFAULT 'Asia/Kolkata',
  location TEXT,
  meeting_url TEXT,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'Planned', -- 'Planned', 'In Progress', 'Completed', 'Cancelled', 'Missed'
  visibility TEXT NOT NULL DEFAULT 'Private', -- 'Public', 'Private'
  show_on_portfolio_heatmap INTEGER NOT NULL DEFAULT 0, -- 1 = true, 0 = false
  color TEXT,
  tags TEXT, -- JSON array of strings, e.g. '["LLM", "RAG"]'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  private_notes TEXT, -- STRICTLY PRIVATE, NEVER RETURNED IN PUBLIC API
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_end_at ON events(end_at);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_heatmap ON events(show_on_portfolio_heatmap, visibility, status);
CREATE INDEX IF NOT EXISTS idx_events_goal ON events(goal_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal ON projects(goal_id);
