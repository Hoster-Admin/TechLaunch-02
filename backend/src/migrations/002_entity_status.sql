-- Add status column to entities table for suspend/unsuspend support
ALTER TABLE entities ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE entities ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS twitter VARCHAR(100);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS why_us TEXT;

CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
