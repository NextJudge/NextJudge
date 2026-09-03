\set ON_ERROR_STOP on
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

LOCK TABLE
    users,
    problem_descriptions,
    test_cases,
    problem_categories,
    events,
    event_problems,
    event_problem_languages,
    event_users,
    event_teams,
    event_questions,
    notifications,
    event_group,
    "group",
    event_problem_id_max_problem_ids,
    submissions,
    submission_test_case_results,
    input_submissions,
    password_reset_tokens
IN EXCLUSIVE MODE;

\ir seed-cohort.sql

CREATE TEMP TABLE recovery_cleanup_guard (
    expected_fingerprint text NOT NULL
) ON COMMIT DROP;
INSERT INTO recovery_cleanup_guard VALUES (:'expected_fingerprint');

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

DO $block$
DECLARE
    actual_fingerprint text;
BEGIN
    SELECT encode(
        digest(string_agg(u.account_identifier || ':' || u.id::text, ',' ORDER BY u.account_identifier), 'sha256'),
        'hex'
    )
    INTO actual_fingerprint
    FROM users AS u
    WHERE u.id IN (SELECT id FROM recovery_target_users);

    IF actual_fingerprint IS DISTINCT FROM
       (SELECT expected_fingerprint FROM recovery_cleanup_guard) THEN
        RAISE EXCEPTION 'seed cohort fingerprint changed; cleanup aborted';
    END IF;
    IF (SELECT count(*) FROM users) <> 54
       OR (SELECT count(*) FROM recovery_target_users) <> 51
       OR (SELECT count(*) FROM recovery_expected_seed_users) <> 51
       OR (SELECT count(*) FROM users WHERE id NOT IN (SELECT id FROM recovery_target_users)) <> 3 THEN
        RAISE EXCEPTION 'user cohort counts changed; cleanup aborted';
    END IF;
    IF (SELECT count(*) FROM problem_descriptions) <> 30
       OR (SELECT count(*) FROM recovery_target_problems) <> 30
       OR (SELECT count(*) FROM test_cases) <> 133
       OR (SELECT count(*) FROM recovery_target_test_cases) <> 133 THEN
        RAISE EXCEPTION 'problem graph counts changed; cleanup aborted';
    END IF;
    IF (SELECT count(*) FROM events) <> 46
       OR (SELECT count(*) FROM recovery_target_events) <> 46
       OR (SELECT count(*) FROM event_problems) <> 249
       OR (SELECT count(*) FROM recovery_target_event_problems) <> 249 THEN
        RAISE EXCEPTION 'event graph counts changed; cleanup aborted';
    END IF;
    IF (SELECT count(*) FROM submissions) <> 10582
       OR (SELECT count(*) FROM recovery_target_submissions) <> 10582
       OR (SELECT count(*) FROM event_questions) <> 68
       OR (SELECT count(*) FROM recovery_target_questions) <> 68 THEN
        RAISE EXCEPTION 'submission or question counts changed; cleanup aborted';
    END IF;
    IF (SELECT count(*) FROM event_problem_languages) <> 0
       OR (SELECT count(*) FROM input_submissions) <> 0
       OR (SELECT count(*) FROM submission_test_case_results) <> 0
       OR (SELECT count(*) FROM password_reset_tokens) <> 0 THEN
        RAISE EXCEPTION 'unexpected auxiliary records found; cleanup aborted';
    END IF;
    IF (SELECT count(*) FROM users WHERE account_identifier = 'github-70242273') <> 1
       OR (SELECT count(*) FROM users
           WHERE account_identifier = 'github-70242273'
             AND id IN (SELECT id FROM recovery_target_users)) <> 0 THEN
        RAISE EXCEPTION 'administrator promotion account is not uniquely preserved; cleanup aborted';
    END IF;
END
$block$;

DELETE FROM event_group
WHERE event_id IN (SELECT id FROM recovery_target_events);

DELETE FROM event_problem_id_max_problem_ids AS counter
WHERE counter.event_id IN (SELECT id FROM recovery_target_events)
   OR NOT EXISTS (SELECT 1 FROM events WHERE events.id = counter.event_id);

DELETE FROM input_submissions
WHERE user_id IN (SELECT id FROM recovery_target_users);

DELETE FROM users
WHERE id IN (SELECT id FROM recovery_target_users);

DELETE FROM "group" AS candidate
WHERE candidate.id IN (SELECT group_id FROM recovery_target_groups)
  AND NOT EXISTS (
      SELECT 1 FROM event_group WHERE event_group.group_id = candidate.id
  );

UPDATE users
SET is_admin = true
WHERE account_identifier = 'github-70242273';

DO $block$
BEGIN
    IF (SELECT count(*) FROM users) <> 3
       OR (SELECT count(*) FROM users u
           JOIN recovery_expected_seed_users expected
             ON expected.account_identifier = u.account_identifier) <> 0 THEN
        RAISE EXCEPTION 'seed users remain or preserved user count changed; cleanup rolled back';
    END IF;
    IF (SELECT count(*) FROM users
        WHERE account_identifier = 'github-70242273' AND COALESCE(is_admin, false)) <> 1 THEN
        RAISE EXCEPTION 'initial administrator promotion failed; cleanup rolled back';
    END IF;
    IF (SELECT count(*) FROM problem_descriptions) <> 0
       OR (SELECT count(*) FROM test_cases) <> 0
       OR (SELECT count(*) FROM events) <> 0
       OR (SELECT count(*) FROM event_problems) <> 0
       OR (SELECT count(*) FROM event_users) <> 0
       OR (SELECT count(*) FROM event_teams) <> 0
       OR (SELECT count(*) FROM event_questions) <> 0
       OR (SELECT count(*) FROM notifications) <> 0
       OR (SELECT count(*) FROM submissions) <> 0
       OR (SELECT count(*) FROM submission_test_case_results) <> 0
       OR (SELECT count(*) FROM input_submissions) <> 0
       OR (SELECT count(*) FROM password_reset_tokens) <> 0
       OR (SELECT count(*) FROM event_group) <> 0
       OR (SELECT count(*) FROM event_problem_id_max_problem_ids) <> 0 THEN
        RAISE EXCEPTION 'seed-owned graph was not completely removed; cleanup rolled back';
    END IF;
END
$block$;

SELECT jsonb_build_object(
    'seed_users_removed', 51,
    'users_preserved', (SELECT count(*) FROM users),
    'problems_remaining', (SELECT count(*) FROM problem_descriptions),
    'events_remaining', (SELECT count(*) FROM events),
    'submissions_remaining', (SELECT count(*) FROM submissions),
    'initial_admin', 'github-70242273'
)::text;

COMMIT;
