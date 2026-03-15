-- Community tags
CREATE TABLE IF NOT EXISTS community_tags (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT         NOT NULL UNIQUE,
  color      TEXT         NOT NULL DEFAULT '#E8621A',
  created_by UUID,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Community posts (no FK constraints to avoid Neon reset ordering issues)
CREATE TABLE IF NOT EXISTS community_posts (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT         NOT NULL CHECK (type IN ('post','article')),
  status         TEXT         NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  title          TEXT,
  body           TEXT         NOT NULL DEFAULT '',
  tag_id         UUID,
  author_id      UUID         NOT NULL,
  likes_count    INTEGER      NOT NULL DEFAULT 0,
  comments_count INTEGER      NOT NULL DEFAULT 0,
  views_count    INTEGER      NOT NULL DEFAULT 0,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default tags
INSERT INTO community_tags (name, color) VALUES
  ('Insight',   '#7C3AED'),
  ('Opinion',   '#E8621A'),
  ('Tutorial',  '#059669'),
  ('News',      '#2563EB'),
  ('Milestone', '#D97706')
ON CONFLICT (name) DO NOTHING;
