-- Allow password_hash to be null for admin-invited users who haven't set a password yet
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add invite token columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users(invite_token);
