-- The rally ("I've got you") — a squadmate reaching back to a slipping member.
-- One rally per (squad, from, to, day) so re-tapping doesn't re-notify.
CREATE TABLE IF NOT EXISTS rally (
    id           BIGSERIAL PRIMARY KEY,
    circle_id    BIGINT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rally_date   DATE NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rally_per_day UNIQUE (circle_id, from_user_id, to_user_id, rally_date)
);

CREATE INDEX IF NOT EXISTS idx_rally_circle_date ON rally (circle_id, rally_date);
