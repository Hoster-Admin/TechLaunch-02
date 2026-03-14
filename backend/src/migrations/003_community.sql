-- Community tags
CREATE TABLE IF NOT EXISTS community_tags (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL UNIQUE,
  color      VARCHAR(20)  NOT NULL DEFAULT '#E8621A',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Community posts (no FK constraints to avoid Neon reset ordering issues)
CREATE TABLE IF NOT EXISTS community_posts (
  id           SERIAL PRIMARY KEY,
  author_id    INTEGER      NOT NULL,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('post','article')),
  status       VARCHAR(20)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  title        TEXT,
  body         TEXT         NOT NULL DEFAULT '',
  tag_id       INTEGER,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default tags
INSERT INTO community_tags (name, color) VALUES
  ('Insight',   '#7C3AED'),
  ('Opinion',   '#E8621A'),
  ('Tutorial',  '#059669'),
  ('News',      '#2563EB'),
  ('Milestone', '#D97706')
ON CONFLICT (name) DO NOTHING;
