-- Profiles, handles, ratings, and PostgreSQL FTS on problem titles.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS handle VARCHAR(32);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS handle_normalized VARCHAR(32);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS handle_changed_at TIMESTAMPTZ;

WITH normalized AS (
    SELECT
        id,
        CASE
            WHEN length(regexp_replace(lower(name), '[^a-z0-9_]', '', 'g')) >= 3 THEN
                substr(regexp_replace(lower(name), '[^a-z0-9_]', '', 'g'), 1, 32)
            ELSE
                'user_' || substr(replace(id::text, '-', ''), 1, 8)
        END AS base_handle
    FROM users
    WHERE handle IS NULL
),
ranked AS (
    SELECT
        id,
        base_handle,
        row_number() OVER (PARTITION BY lower(base_handle) ORDER BY id) AS rn
    FROM normalized
)
UPDATE users u
SET
    handle = CASE
        WHEN r.rn = 1 THEN r.base_handle
        ELSE r.base_handle || '_' || (r.rn - 1)::text
    END,
    handle_normalized = lower(CASE
        WHEN r.rn = 1 THEN r.base_handle
        ELSE r.base_handle || '_' || (r.rn - 1)::text
    END)
FROM ranked r
WHERE u.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_normalized
    ON users (handle_normalized)
    WHERE deleted_at IS NULL AND handle_normalized IS NOT NULL;

ALTER TABLE problem_descriptions
    ADD COLUMN IF NOT EXISTS title_search TSVECTOR;

UPDATE problem_descriptions
SET title_search = to_tsvector('english', coalesce(title, ''))
WHERE title_search IS NULL;

CREATE INDEX IF NOT EXISTS idx_problem_descriptions_title_search
    ON problem_descriptions USING GIN (title_search);

CREATE OR REPLACE FUNCTION problem_descriptions_title_search_trigger()
RETURNS trigger AS $$
BEGIN
    NEW.title_search := to_tsvector('english', coalesce(NEW.title, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_problem_descriptions_title_search ON problem_descriptions;

CREATE TRIGGER trg_problem_descriptions_title_search
    BEFORE INSERT OR UPDATE OF title ON problem_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION problem_descriptions_title_search_trigger();

CREATE TABLE IF NOT EXISTS rating_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id INTEGER REFERENCES events (id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    is_rated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rating_events_event_id ON rating_events (event_id);

CREATE TABLE IF NOT EXISTS rating_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating_event_id UUID NOT NULL REFERENCES rating_events (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    old_rating INTEGER NOT NULL,
    new_rating INTEGER NOT NULL,
    rating_delta INTEGER NOT NULL,
    rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rating_event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_changes_user_id ON rating_changes (user_id);
CREATE INDEX IF NOT EXISTS idx_rating_changes_rating_event_id ON rating_changes (rating_event_id);

CREATE TABLE IF NOT EXISTS user_ratings (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    rating INTEGER NOT NULL DEFAULT 1200,
    max_rating INTEGER NOT NULL DEFAULT 1200,
    contests_rated INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
