-- Contest maturity: visibility, registration, roles, standings config, outbox.

DO $$ BEGIN
    CREATE TYPE event_visibility AS ENUM ('public', 'unlisted', 'private');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE upsolve_mode AS ENUM ('disabled', 'after_end', 'always');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE event_role_kind AS ENUM ('owner', 'organizer', 'judge', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE participation_mode AS ENUM ('official', 'virtual', 'practice');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS visibility event_visibility NOT NULL DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS invite_code_hash bytea,
    ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS registration_end TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS participant_limit INTEGER,
    ADD COLUMN IF NOT EXISTS penalty_minutes INTEGER NOT NULL DEFAULT 20,
    ADD COLUMN IF NOT EXISTS freeze_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS upsolve_mode upsolve_mode NOT NULL DEFAULT 'disabled';

CREATE TABLE IF NOT EXISTS event_roles (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    role event_role_kind NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id, role)
);

CREATE INDEX IF NOT EXISTS idx_event_roles_event_id ON event_roles (event_id);

ALTER TABLE event_users
    ADD COLUMN IF NOT EXISTS participation_mode participation_mode NOT NULL DEFAULT 'official';

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR NOT NULL,
    aggregate_type VARCHAR NOT NULL,
    aggregate_id VARCHAR NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_created
    ON outbox_events (status, created_at);
