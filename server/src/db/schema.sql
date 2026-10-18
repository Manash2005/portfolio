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
  short_description TEXT,
  outcome TEXT,
  problem TEXT,
  architecture TEXT,
  key_challenge TEXT,
  solution TEXT,
  metrics TEXT, -- JSON array of strings
  category TEXT NOT NULL DEFAULT 'AI / Automation',
  status TEXT NOT NULL DEFAULT 'active', -- 'planned', 'active', 'completed'
  tech_stack TEXT, -- JSON array of strings
  live_link TEXT,
  github_link TEXT,
  image TEXT,
  featured INTEGER NOT NULL DEFAULT 0, -- 1 = true, 0 = false
  reflection TEXT,
  is_published INTEGER NOT NULL DEFAULT 1, -- 1 = published, 0 = draft
  display_order INTEGER NOT NULL DEFAULT 0,
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

-- 4. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. Persistent Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  last_active_at TEXT DEFAULT (datetime('now'))
);

-- 6. Login Rate Limiting Table (IP & Timestamp based sliding window)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  attempt_time INTEGER NOT NULL
);

-- 7. Portfolio Content Table (Key-Value storage for dynamic editable sections)
CREATE TABLE IF NOT EXISTS portfolio_content (
  section_key TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 8. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_end_at ON events(end_at);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_heatmap ON events(show_on_portfolio_heatmap, visibility, status);
CREATE INDEX IF NOT EXISTS idx_events_goal ON events(goal_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal ON projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip, attempt_time);

-- 8. Curated AI Blogs Table (Structured tech articles with original content preservation)
CREATE TABLE IF NOT EXISTS blogs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  original_author TEXT,
  published_date TEXT,
  topic TEXT NOT NULL DEFAULT 'Engineering',
  subtopics TEXT DEFAULT '[]', -- JSON array of string tags
  summary TEXT,
  cover_image TEXT,
  reading_time_minutes INTEGER DEFAULT 5,
  content_json TEXT NOT NULL DEFAULT '[]', -- JSON array of sections and elements
  key_takeaways TEXT DEFAULT '[]', -- JSON array of key takeaways
  raw_markdown TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_topic ON blogs(topic);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at);
