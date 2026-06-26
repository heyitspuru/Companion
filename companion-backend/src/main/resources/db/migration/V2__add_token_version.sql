-- Per-user JWT version. Bumping it invalidates every token issued before the
-- bump (used on password reset so old sessions can't outlive the reset).
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
