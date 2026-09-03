\set ON_ERROR_STOP on
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

\ir seed-cohort.sql

CREATE TEMP TABLE recovery_target_problems ON COMMIT DROP AS
SELECT id FROM problem_descriptions WHERE user_id IN (SELECT id FROM recovery_target_users);

CREATE TEMP TABLE recovery_target_events ON COMMIT DROP AS
SELECT id FROM events WHERE user_id IN (SELECT id FROM recovery_target_users);

CREATE TEMP TABLE recovery_target_event_problems ON COMMIT DROP AS
SELECT id
FROM event_problems
WHERE event_id IN (SELECT id FROM recovery_target_events)
   OR problem_id IN (SELECT id FROM recovery_target_problems);

CREATE TEMP TABLE recovery_target_test_cases ON COMMIT DROP AS
SELECT id FROM test_cases WHERE problem_id IN (SELECT id FROM recovery_target_problems);

CREATE TEMP TABLE recovery_target_submissions ON COMMIT DROP AS
SELECT id
FROM submissions
WHERE user_id IN (SELECT id FROM recovery_target_users)
   OR problem_id IN (SELECT id FROM recovery_target_problems)
   OR event_id IN (SELECT id FROM recovery_target_events)
   OR event_problem_id IN (SELECT id FROM recovery_target_event_problems)
   OR failed_test_case_id IN (SELECT id FROM recovery_target_test_cases);

CREATE TEMP TABLE recovery_target_questions ON COMMIT DROP AS
SELECT id
FROM event_questions
WHERE user_id IN (SELECT id FROM recovery_target_users)
   OR event_id IN (SELECT id FROM recovery_target_events)
   OR problem_id IN (SELECT id FROM recovery_target_problems);

CREATE TEMP TABLE recovery_target_groups ON COMMIT DROP AS
SELECT DISTINCT group_id
FROM event_group
WHERE event_id IN (SELECT id FROM recovery_target_events);

WITH counts AS (
    SELECT jsonb_build_object(
        'total_users', (SELECT count(*) FROM users),
        'total_problems', (SELECT count(*) FROM problem_descriptions),
        'total_test_cases', (SELECT count(*) FROM test_cases),
        'total_events', (SELECT count(*) FROM events),
        'total_event_problems', (SELECT count(*) FROM event_problems),
        'total_submissions', (SELECT count(*) FROM submissions),
        'total_questions', (SELECT count(*) FROM event_questions),
        'seed_users', (SELECT count(*) FROM recovery_target_users),
        'expected_seed_identities', (SELECT count(*) FROM recovery_expected_seed_users),
        'unmatched_seed_identities', (
            SELECT count(*)
            FROM recovery_expected_seed_users AS expected
            LEFT JOIN users AS u
              ON u.account_identifier = expected.account_identifier
             AND u.email = expected.email
             AND u.name = expected.name
             AND COALESCE(u.is_admin, false) = expected.is_admin
            WHERE u.id IS NULL
        ),
        'preserved_users', (SELECT count(*) FROM users WHERE id NOT IN (SELECT id FROM recovery_target_users)),
        'promotion_accounts', (SELECT count(*) FROM users WHERE account_identifier = 'github-70242273'),
        'promotion_accounts_admin', (
            SELECT count(*) FROM users
            WHERE account_identifier = 'github-70242273' AND COALESCE(is_admin, false)
        ),
        'promotion_accounts_in_seed', (
            SELECT count(*) FROM users
            WHERE account_identifier = 'github-70242273'
              AND id IN (SELECT id FROM recovery_target_users)
        ),
        'problems', (SELECT count(*) FROM recovery_target_problems),
        'seed_signature_problems', (
            SELECT count(*) FROM problem_descriptions
            WHERE source = 'NextJudge Dev Seed' OR identifier ~ '^problem-([1-9]|[12][0-9]|30)$'
        ),
        'test_cases', (SELECT count(*) FROM recovery_target_test_cases),
        'problem_categories', (
            SELECT count(*) FROM problem_categories WHERE problem_id IN (SELECT id FROM recovery_target_problems)
        ),
        'events', (SELECT count(*) FROM recovery_target_events),
        'event_problems', (SELECT count(*) FROM recovery_target_event_problems),
        'event_users', (
            SELECT count(*) FROM event_users
            WHERE user_id IN (SELECT id FROM recovery_target_users)
               OR event_id IN (SELECT id FROM recovery_target_events)
        ),
        'event_teams', (
            SELECT count(*) FROM event_teams WHERE event_id IN (SELECT id FROM recovery_target_events)
        ),
        'event_groups', (
            SELECT count(*) FROM event_group WHERE event_id IN (SELECT id FROM recovery_target_events)
        ),
        'groups', (SELECT count(*) FROM recovery_target_groups),
        'event_problem_languages', (SELECT count(*) FROM event_problem_languages),
        'event_counters_and_stale', (
            SELECT count(*) FROM event_problem_id_max_problem_ids AS counter
            WHERE counter.event_id IN (SELECT id FROM recovery_target_events)
               OR NOT EXISTS (SELECT 1 FROM events WHERE events.id = counter.event_id)
        ),
        'submissions', (SELECT count(*) FROM recovery_target_submissions),
        'submission_test_case_results', (
            SELECT count(*) FROM submission_test_case_results
            WHERE submission_id IN (SELECT id FROM recovery_target_submissions)
               OR test_case_id IN (SELECT id FROM recovery_target_test_cases)
        ),
        'input_submissions', (
            SELECT count(*) FROM input_submissions WHERE user_id IN (SELECT id FROM recovery_target_users)
        ),
        'questions', (SELECT count(*) FROM recovery_target_questions),
        'questions_answered_by_seed_only', (
            SELECT count(*) FROM event_questions
            WHERE answered_by IN (SELECT id FROM recovery_target_users)
              AND id NOT IN (SELECT id FROM recovery_target_questions)
        ),
        'notifications', (
            SELECT count(*) FROM notifications
            WHERE user_id IN (SELECT id FROM recovery_target_users)
               OR event_id IN (SELECT id FROM recovery_target_events)
               OR question_id IN (SELECT id FROM recovery_target_questions)
        ),
        'password_reset_tokens', (
            SELECT count(*) FROM password_reset_tokens WHERE user_id IN (SELECT id FROM recovery_target_users)
        )
    ) AS value
), cohort AS (
    SELECT encode(
        digest(string_agg(u.account_identifier || ':' || u.id::text, ',' ORDER BY u.account_identifier), 'sha256'),
        'hex'
    ) AS fingerprint
    FROM users AS u
    WHERE u.id IN (SELECT id FROM recovery_target_users)
)
SELECT jsonb_build_object(
    'schema_version', 1,
    'collected_at', clock_timestamp(),
    'validated', false,
    'validation_note', '',
    'target', jsonb_build_object(
        'database', current_database(),
        'server_address', COALESCE(inet_server_addr()::text, 'local'),
        'server_port', COALESCE(inet_server_port(), 0)
    ),
    'seed_cohort_fingerprint', cohort.fingerprint,
    'counts', counts.value
)::text
FROM counts, cohort;

ROLLBACK;
