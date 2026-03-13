-- ════════════════════════════════════════════════════════
-- Tech Launch MENA — Full PostgreSQL Schema
-- ════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ── ENUMS ────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('user', 'admin', 'moderator', 'editor', 'analyst');
CREATE TYPE user_persona   AS ENUM ('Founder', 'Investor', 'Product Manager', 'Accelerator', 'Enthusiast');
CREATE TYPE user_status    AS ENUM ('active', 'suspended', 'banned', 'pending_verification');
CREATE TYPE product_status AS ENUM ('pending', 'live', 'soon', 'rejected', 'draft');
CREATE TYPE entity_type    AS ENUM ('startup', 'accelerator', 'investor', 'venture_studio');
CREATE TYPE app_status     AS ENUM ('pending', 'reviewing', 'accepted', 'rejected');
CREATE TYPE pitch_status   AS ENUM ('sent', 'reviewing', 'interested', 'follow-up', 'rejected', 'funded');
CREATE TYPE post_type      AS ENUM ('update', 'milestone', 'feature', 'news');

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  handle        VARCHAR(60)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  avatar_color  VARCHAR(10)  DEFAULT '#E15033',
  bio           TEXT,
  website       VARCHAR(255),
  twitter       VARCHAR(100),
  linkedin      VARCHAR(100),
  country       VARCHAR(60),
  persona       user_persona NOT NULL DEFAULT 'Founder',
  role          user_role    NOT NULL DEFAULT 'user',
  status        user_status  NOT NULL DEFAULT 'active',
  verified      BOOLEAN      NOT NULL DEFAULT false,
  email_verified BOOLEAN     NOT NULL DEFAULT false,
  products_count  INTEGER    NOT NULL DEFAULT 0,
  votes_given     INTEGER    NOT NULL DEFAULT 0,
  followers_count INTEGER    NOT NULL DEFAULT 0,
  following_count INTEGER    NOT NULL DEFAULT 0,
  entity_id     UUID         REFERENCES entities(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_search ON users USING gin(name gin_trgm_ops);

-- ── PRODUCTS ──────────────────────────────────────────────
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(120) NOT NULL,
  tagline         VARCHAR(255) NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  logo_emoji      VARCHAR(10)  DEFAULT '🚀',
  website         VARCHAR(255),
  demo_url        VARCHAR(255),
  video_url       VARCHAR(255),
  industry        VARCHAR(80)  NOT NULL,
  countries       TEXT[]       NOT NULL DEFAULT '{}',
  status          product_status NOT NULL DEFAULT 'pending',
  featured        BOOLEAN      NOT NULL DEFAULT false,
  featured_order  INTEGER,
  editors_pick    BOOLEAN      NOT NULL DEFAULT false,
  editors_comment TEXT,
  upvotes_count   INTEGER      NOT NULL DEFAULT 0,
  comments_count  INTEGER      NOT NULL DEFAULT 0,
  bookmarks_count INTEGER      NOT NULL DEFAULT 0,
  views_count     INTEGER      NOT NULL DEFAULT 0,
  waitlist_count  INTEGER      NOT NULL DEFAULT 0,
  submitted_by    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by     UUID         REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  rejected_reason TEXT,
  tags            TEXT[]       DEFAULT '{}',
  launch_date     DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_status      ON products(status);
CREATE INDEX idx_products_featured    ON products(featured) WHERE featured = true;
CREATE INDEX idx_products_submitted   ON products(submitted_by);
CREATE INDEX idx_products_industry    ON products(industry);
CREATE INDEX idx_products_upvotes     ON products(upvotes_count DESC);
CREATE INDEX idx_products_created     ON products(created_at DESC);
CREATE INDEX idx_products_search      ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_countries   ON products USING gin(countries);

-- ── PRODUCT MEDIA ─────────────────────────────────────────
CREATE TABLE product_media (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'image', -- image | video
  order_num  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── UPVOTES ───────────────────────────────────────────────
CREATE TABLE upvotes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_upvotes_product ON upvotes(product_id);
CREATE INDEX idx_upvotes_user    ON upvotes(user_id);

-- ── BOOKMARKS ─────────────────────────────────────────────
CREATE TABLE bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ── COMMENTS ─────────────────────────────────────────────
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_product ON comments(product_id);
CREATE INDEX idx_comments_user    ON comments(user_id);

-- ── WAITLISTS ─────────────────────────────────────────────
CREATE TABLE waitlist_signups (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email      VARCHAR(255) NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, email)
);

CREATE INDEX idx_waitlist_product ON waitlist_signups(product_id);

-- ── ENTITIES ─────────────────────────────────────────────
CREATE TABLE entities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(120) NOT NULL,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  type            entity_type  NOT NULL,
  logo_url        TEXT,
  logo_emoji      VARCHAR(10) DEFAULT '🏢',
  description     TEXT,
  website         VARCHAR(255),
  country         VARCHAR(80),
  industry        VARCHAR(80),
  stage           VARCHAR(80),
  employees       VARCHAR(40),
  founded_year    INTEGER,
  aum             VARCHAR(40),
  portfolio_count INTEGER DEFAULT 0,
  focus           VARCHAR(255),
  verified        BOOLEAN NOT NULL DEFAULT false,
  verified_by     UUID REFERENCES users(id),
  followers_count INTEGER NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_type    ON entities(type);
CREATE INDEX idx_entities_country ON entities(country);
CREATE INDEX idx_entities_search  ON entities USING gin(name gin_trgm_ops);

-- ── FOLLOWS ───────────────────────────────────────────────
CREATE TABLE follows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ── ACCELERATOR APPLICATIONS ──────────────────────────────
CREATE TABLE accelerator_applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id     UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  startup_name  VARCHAR(120),
  stage         VARCHAR(80),
  pitch         TEXT,
  status        app_status NOT NULL DEFAULT 'pending',
  notes         TEXT,
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accel_apps_applicant ON accelerator_applications(applicant_id);
CREATE INDEX idx_accel_apps_entity    ON accelerator_applications(entity_id);
CREATE INDEX idx_accel_apps_status    ON accelerator_applications(status);

-- ── INVESTOR PITCHES ──────────────────────────────────────
CREATE TABLE investor_pitches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investor_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  ask_amount   VARCHAR(40),
  pitch_deck   TEXT,
  description  TEXT,
  status       pitch_status NOT NULL DEFAULT 'sent',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(60) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  link       VARCHAR(255),
  read       BOOLEAN NOT NULL DEFAULT false,
  data       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user  ON notifications(user_id);
CREATE INDEX idx_notifs_read  ON notifications(user_id, read) WHERE read = false;

-- ── PLATFORM POSTS (Admin public profile posts) ───────────
CREATE TABLE platform_posts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       post_type NOT NULL DEFAULT 'update',
  body       TEXT NOT NULL,
  author_id  UUID NOT NULL REFERENCES users(id),
  likes      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PLATFORM SETTINGS ────────────────────────────────────
CREATE TABLE platform_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  type       VARCHAR(20) NOT NULL DEFAULT 'boolean', -- boolean | string | json
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TEAM MEMBERS ─────────────────────────────────────────
CREATE TABLE team_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'moderator',
  added_by   UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── ACTIVITY LOG ─────────────────────────────────────────
CREATE TABLE activity_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(80) NOT NULL,
  entity     VARCHAR(80),
  entity_id  UUID,
  details    JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_actor  ON activity_log(actor_id);
CREATE INDEX idx_activity_action ON activity_log(action);
CREATE INDEX idx_activity_time   ON activity_log(created_at DESC);

-- ── REFRESH TOKENS ───────────────────────────────────────
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ── TRIGGERS: updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','products','comments','entities','accelerator_applications','investor_pitches','platform_posts'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END;
$$;

-- ── TRIGGER: product upvote counter ───────────────────────
CREATE OR REPLACE FUNCTION sync_upvote_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET upvotes_count = upvotes_count + 1 WHERE id = NEW.product_id;
    UPDATE users SET votes_given = votes_given + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.product_id;
    UPDATE users SET votes_given = GREATEST(votes_given - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_upvote_count
AFTER INSERT OR DELETE ON upvotes
FOR EACH ROW EXECUTE FUNCTION sync_upvote_count();

-- ── TRIGGER: bookmark counter ─────────────────────────────
CREATE OR REPLACE FUNCTION sync_bookmark_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET bookmarks_count = GREATEST(bookmarks_count - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookmark_count
AFTER INSERT OR DELETE ON bookmarks
FOR EACH ROW EXECUTE FUNCTION sync_bookmark_count();

-- ── TRIGGER: follow counters ──────────────────────────────
CREATE OR REPLACE FUNCTION sync_follow_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follow_count
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION sync_follow_count();

-- ── TRIGGER: comment counter ──────────────────────────────
CREATE OR REPLACE FUNCTION sync_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET comments_count = comments_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION sync_comment_count();

-- ── DEFAULT PLATFORM SETTINGS ────────────────────────────
INSERT INTO platform_settings (key, value, type) VALUES
  ('manual_approval',         'true',  'boolean'),
  ('auto_verify_trusted',     'false', 'boolean'),
  ('spam_detection',          'true',  'boolean'),
  ('profanity_filter',        'true',  'boolean'),
  ('platform_live',           'true',  'boolean'),
  ('open_registration',       'true',  'boolean'),
  ('arabic_rtl',              'true',  'boolean'),
  ('show_coming_soon',        'true',  'boolean'),
  ('notif_new_submission',    'true',  'boolean'),
  ('notif_new_signup',        'false', 'boolean'),
  ('notif_reported_content',  'true',  'boolean'),
  ('notif_weekly_analytics',  'true',  'boolean'),
  ('banner_message',          '🚀 Discover the next big thing from the MENA region', 'string'),
  ('banner_cta',              'Submit Your Product →', 'string'),
  ('banner_visible',          'true',  'boolean'),
  ('platform_name',           'Tech Launch', 'string'),
  ('platform_handle',         '@techlaunch', 'string'),
  ('platform_bio',            'The MENA region''s premier product discovery platform.', 'string'),
  ('platform_website',        'https://techlaunch.io', 'string'),
  ('platform_twitter',        '@TechLaunchMENA', 'string'),
  ('platform_linkedin',       'tech-launch-mena', 'string');
