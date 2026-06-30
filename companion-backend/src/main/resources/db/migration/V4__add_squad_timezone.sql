-- Per-squad clock (fireteam pivot, Phase 2). "Today" and the at-risk cutoff are
-- meaningless without a timezone; before this, all daily mechanics used server
-- time. Existing rows fall back to UTC (handled in Circle#zoneId).
ALTER TABLE circles ADD COLUMN IF NOT EXISTS timezone VARCHAR(64);
ALTER TABLE circles ADD COLUMN IF NOT EXISTS daily_cutoff TIME DEFAULT '21:00:00';
