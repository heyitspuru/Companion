-- Collective (squad) streak — shared fate for the fireteam. Advances only on days
-- when every member hits their threshold; see TaskService. The fireteam pivot
-- (PRODUCT.md) replaces per-member competition with this shared metric.
ALTER TABLE circles ADD COLUMN IF NOT EXISTS squad_current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE circles ADD COLUMN IF NOT EXISTS squad_longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE circles ADD COLUMN IF NOT EXISTS squad_last_complete_date DATE;
