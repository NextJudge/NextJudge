-- Community solutions, moderation, similarity review, and integrity signals.

DO $$ BEGIN
    CREATE TYPE community_solution_status AS ENUM ('draft', 'published', 'hidden', 'removed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_target_type AS ENUM ('community_solution', 'comment', 'user');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_queue_status AS ENUM ('pending', 'in_review', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE similarity_case_status AS ENUM ('pending', 'reviewed', 'dismissed', 'confirmed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE integrity_signal_type AS ENUM ('ip_hash', 'session_hash');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE fingerprint_status AS ENUM ('pending', 'computed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS community_solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id INTEGER NOT NULL REFERENCES problem_descriptions (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions (id) ON DELETE SET NULL,
    language_id UUID REFERENCES languages (id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    source_code TEXT,
    status community_solution_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_solutions_problem_id
    ON community_solutions (problem_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_solutions_user_id
    ON community_solutions (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_solutions_user_problem
    ON community_solutions (problem_id, user_id)
    WHERE status = 'published';

CREATE TABLE IF NOT EXISTS solution_votes (
    solution_id UUID NOT NULL REFERENCES community_solutions (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (solution_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_solution_id UUID NOT NULL REFERENCES community_solutions (id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth < 5),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_solution_id
    ON comments (community_solution_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
    ON comments (parent_id);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target_type moderation_target_type NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status
    ON reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_target
    ON reports (target_type, target_id);

CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type moderation_target_type NOT NULL,
    target_id UUID NOT NULL,
    report_id UUID REFERENCES reports (id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    status moderation_queue_status NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES users (id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status
    ON moderation_queue (status, priority DESC, created_at ASC);

CREATE TABLE IF NOT EXISTS submission_fingerprints (
    submission_id UUID PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problem_descriptions (id) ON DELETE CASCADE,
    fingerprint_hash VARCHAR(64) NOT NULL,
    status fingerprint_status NOT NULL DEFAULT 'pending',
    computed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_fingerprints_problem_hash
    ON submission_fingerprints (problem_id, fingerprint_hash);

CREATE INDEX IF NOT EXISTS idx_submission_fingerprints_status
    ON submission_fingerprints (status, created_at ASC);

CREATE TABLE IF NOT EXISTS similarity_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    compared_submission_id UUID NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    status similarity_case_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE (submission_id, compared_submission_id),
    CHECK (submission_id <> compared_submission_id)
);

CREATE INDEX IF NOT EXISTS idx_similarity_cases_status
    ON similarity_cases (status, detected_at DESC);

CREATE TABLE IF NOT EXISTS integrity_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    submission_id UUID REFERENCES submissions (id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events (id) ON DELETE SET NULL,
    signal_type integrity_signal_type NOT NULL,
    signal_hash VARCHAR(64) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrity_signals_submission
    ON integrity_signals (submission_id);

CREATE INDEX IF NOT EXISTS idx_integrity_signals_hash
    ON integrity_signals (signal_type, signal_hash, recorded_at DESC);
