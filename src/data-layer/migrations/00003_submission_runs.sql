-- +goose Up
-- +goose StatementBegin
-- submission_runs tracks each judge attempt for a submission.

CREATE TABLE IF NOT EXISTS submission_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL,
    run_number INT NOT NULL,
    status status NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    judge_worker_id TEXT,
    stdout TEXT,
    stderr TEXT,
    time_elapsed FLOAT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    UNIQUE (submission_id, run_number)
);

DO $$ BEGIN
    ALTER TABLE submission_runs
        ADD CONSTRAINT submission_runs_submission_id_fkey
        FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_submission_runs_submission_id ON submission_runs (submission_id);

ALTER TABLE submission_test_case_results
    ADD COLUMN IF NOT EXISTS run_id UUID;

DO $$ BEGIN
    ALTER TABLE submission_test_case_results
        ADD CONSTRAINT submission_test_case_results_run_id_fkey
        FOREIGN KEY (run_id) REFERENCES submission_runs (id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Backfill one run per existing submission.
INSERT INTO submission_runs (
    id,
    submission_id,
    run_number,
    status,
    stdout,
    stderr,
    time_elapsed,
    started_at,
    finished_at
)
SELECT
    uuid_generate_v4(),
    s.id,
    1,
    s.status,
    s.stdout,
    s.stderr,
    s.time_elapsed,
    s.submit_time,
    CASE WHEN s.status != 'PENDING' THEN s.submit_time ELSE NULL END
FROM submissions s
WHERE NOT EXISTS (
    SELECT 1 FROM submission_runs sr WHERE sr.submission_id = s.id
);

UPDATE submission_test_case_results stcr
SET run_id = sr.id
FROM submission_runs sr
WHERE stcr.submission_id = sr.submission_id
  AND sr.run_number = 1
  AND stcr.run_id IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- no-op down migration
-- +goose StatementEnd
