-- Incremental schema updates for existing deployments.
-- Each statement must be safe to run multiple times.

DO $$ BEGIN
    CREATE TYPE enqueue_state AS ENUM ('pending', 'queued', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS enqueue_state enqueue_state NOT NULL DEFAULT 'queued';

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS enqueued_at TIMESTAMPTZ;

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS enqueue_attempts INT NOT NULL DEFAULT 0;

-- Re-queue any submission that was never judged so the reaper can deliver it.
UPDATE submissions
SET enqueue_state = 'pending', enqueue_attempts = 0
WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS input_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    language_id UUID NOT NULL,
    source_code TEXT NOT NULL,
    stdin TEXT NOT NULL DEFAULT '',
    status status NOT NULL DEFAULT 'PENDING',
    stdout TEXT,
    stderr TEXT,
    runtime FLOAT NOT NULL DEFAULT 0,
    finished BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enqueue_state enqueue_state NOT NULL DEFAULT 'pending',
    enqueued_at TIMESTAMPTZ,
    enqueue_attempts INT NOT NULL DEFAULT 0
);

DO $$ BEGIN
    ALTER TABLE input_submissions
        ADD CONSTRAINT input_submissions_language_id_fkey
        FOREIGN KEY (language_id) REFERENCES languages (id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_stale_enqueue
    ON submissions (submit_time)
    WHERE status = 'PENDING' AND enqueue_state IN ('pending', 'queued');

CREATE INDEX IF NOT EXISTS idx_input_submissions_stale_enqueue
    ON input_submissions (created_at)
    WHERE finished = false AND enqueue_state IN ('pending', 'queued');
