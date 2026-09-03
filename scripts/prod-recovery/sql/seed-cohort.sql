CREATE TEMP TABLE recovery_expected_seed_users (
    account_identifier text PRIMARY KEY,
    email text NOT NULL,
    name text NOT NULL,
    is_admin boolean NOT NULL
) ON COMMIT DROP;

WITH seed_names AS (
    SELECT
        ARRAY[
            'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
            'Kate', 'Liam', 'Maya', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tara',
            'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe', 'Alex', 'Blake', 'Casey', 'Drew',
            'Eli', 'Finn', 'Gwen', 'Harper', 'Ian', 'Jordan', 'Kelly', 'Logan', 'Morgan', 'Nico',
            'Owen', 'Parker', 'Riley', 'Sage', 'Taylor', 'Avery', 'Cameron', 'Dakota', 'Emerson', 'Finley'
        ]::text[] AS first_names,
        ARRAY[
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
        ]::text[] AS last_names
), generated AS (
    SELECT
        i,
        first_names[i + 1] AS first_name,
        last_names[(i % 20) + 1] AS last_name
    FROM seed_names
    CROSS JOIN generate_series(0, 49) AS i
)
INSERT INTO recovery_expected_seed_users (account_identifier, email, name, is_admin)
SELECT
    'basic-' || email,
    email,
    first_name || ' ' || last_name,
    i < 5
FROM generated
CROSS JOIN LATERAL (
    SELECT first_name || '.' || last_name || i::text || '@example.com' AS email
) AS generated_email
UNION ALL
SELECT
    'basic-seed-marker@nextjudge.dev',
    'seed-marker@nextjudge.dev',
    'Seed Marker',
    false;

CREATE TEMP TABLE recovery_target_users ON COMMIT DROP AS
SELECT u.id
FROM users AS u
JOIN recovery_expected_seed_users AS expected
  ON expected.account_identifier = u.account_identifier
 AND expected.email = u.email
 AND expected.name = u.name
 AND expected.is_admin = COALESCE(u.is_admin, false);

CREATE UNIQUE INDEX ON recovery_target_users (id);
