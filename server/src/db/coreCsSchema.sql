-- Core CS Fundamentals & Active Recall Arena Schema
-- Subjects: OS, DBMS & SQL, Computer Networks, System Design, OOPs & LLD

-- 1. Curated & Custom Cards Table
CREATE TABLE IF NOT EXISTS core_cs_cards (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,         -- 'OS', 'DBMS', 'CN', 'System Design', 'OOPs'
  subtopic TEXT NOT NULL,        -- e.g. 'Virtual Memory & Paging'
  title TEXT NOT NULL,           -- e.g. 'How does TLB miss handling work?'
  question TEXT NOT NULL,
  answer_markdown TEXT NOT NULL, -- Rich markdown explanation
  key_takeaway TEXT,             -- 1-sentence quick recall summary
  difficulty TEXT NOT NULL DEFAULT 'Standard',      -- 'Standard', 'High-Frequency', 'Tricky'
  interview_frequency TEXT DEFAULT 'Core CS Standard', -- 'Top 50 Must Know', 'Tier-1 Tech Favorite', 'Core CS Standard'
  code_snippet TEXT,             -- Optional code snippet
  code_language TEXT,            -- e.g. 'cpp', 'java', 'sql', 'python'
  diagram_ascii TEXT,            -- Optional ASCII flow / architecture diagram
  is_custom INTEGER DEFAULT 0,   -- 1 if user created, 0 if system curated
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_core_cs_subject ON core_cs_cards(subject);
CREATE INDEX IF NOT EXISTS idx_core_cs_subtopic ON core_cs_cards(subtopic);
CREATE INDEX IF NOT EXISTS idx_core_cs_diff ON core_cs_cards(difficulty);
CREATE INDEX IF NOT EXISTS idx_core_cs_freq ON core_cs_cards(interview_frequency);

-- 2. Spaced Repetition (SM-2) Reviews Table
CREATE TABLE IF NOT EXISTS core_cs_reviews (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  repetition_count INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 1,
  ease_factor REAL DEFAULT 2.5,
  last_reviewed_at TEXT,
  next_review_at TEXT NOT NULL,  -- YYYY-MM-DD
  last_quality INTEGER DEFAULT 0, -- 1: Again, 2: Hard, 3: Good, 4: Easy
  is_mastered INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES core_cs_cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_cs_review_next ON core_cs_reviews(next_review_at);
CREATE INDEX IF NOT EXISTS idx_core_cs_review_card ON core_cs_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_core_cs_review_mastered ON core_cs_reviews(is_mastered);

-- 3. Rapid Pre-Interview Cheat Sheets Table
CREATE TABLE IF NOT EXISTS core_cs_cheat_sheets (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,         -- 'OS', 'DBMS', 'CN', 'System Design', 'OOPs'
  title TEXT NOT NULL,           -- e.g. 'Process vs Thread Internals'
  summary TEXT NOT NULL,         -- Quick summary of trade-offs
  comparison_table_json TEXT NOT NULL, -- JSON array of columns & rows
  key_rules_json TEXT DEFAULT '[]',    -- JSON array of rapid mental model bullet tips
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_core_cs_sheet_subject ON core_cs_cheat_sheets(subject);
