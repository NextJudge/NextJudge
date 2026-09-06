-- +goose Up
-- +goose StatementBegin
-- Problem lifecycle: revisions, editorials, and publication state.

DO $$ BEGIN
    CREATE TYPE problem_state AS ENUM ('draft', 'review', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE editorial_visibility AS ENUM ('public', 'after_solve', 'after_event');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE problem_descriptions
    ADD COLUMN IF NOT EXISTS state problem_state NOT NULL DEFAULT 'draft';

UPDATE problem_descriptions
SET state = 'published'
WHERE public = true AND state = 'draft';

CREATE TABLE IF NOT EXISTS problem_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id INTEGER NOT NULL REFERENCES problem_descriptions (id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    identifier VARCHAR NOT NULL,
    prompt VARCHAR NOT NULL,
    source VARCHAR,
    difficulty difficulty NOT NULL,
    state problem_state NOT NULL DEFAULT 'draft',
    default_accept_timeout FLOAT NOT NULL,
    default_execution_timeout FLOAT NOT NULL,
    default_memory_limit INTEGER NOT NULL,
    public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE (problem_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_problem_revisions_problem_id
    ON problem_revisions (problem_id);

CREATE INDEX IF NOT EXISTS idx_problem_revisions_state
    ON problem_revisions (state);

CREATE TABLE IF NOT EXISTS editorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES problem_revisions (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    visibility editorial_visibility NOT NULL DEFAULT 'after_solve',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (revision_id)
);

CREATE INDEX IF NOT EXISTS idx_editorials_revision_id
    ON editorials (revision_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- no-op down migration
-- +goose StatementEnd
