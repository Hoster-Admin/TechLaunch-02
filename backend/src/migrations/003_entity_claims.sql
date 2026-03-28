-- ── ENTITY CLAIMS ─────────────────────────────────────────
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE entity_claims (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  status      claim_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entity_claims_user   ON entity_claims(user_id);
CREATE INDEX idx_entity_claims_entity ON entity_claims(entity_id);
CREATE INDEX idx_entity_claims_status ON entity_claims(status);

-- ── Add associated_entity_id to users table ────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS associated_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;

CREATE INDEX idx_users_associated_entity ON users(associated_entity_id);
