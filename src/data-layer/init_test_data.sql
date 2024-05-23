INSERT INTO "languages" (name, extension, version)
VALUES
('c',           '.c',       '13.2.0'),
('c++',         '.cpp',     '13.2.0'),
('pypy',        '.py',      '3.9.18'),
('python',      '.py',      '3.12.3'),
('rust',        '.rs',      '1.78.0'),
('go',          '.go',      '1.22.1'),
('javascript',  '.js',      '21.6.2'),
('typescript',  '.ts',      '5.4.5'),
('java',        '.java',    '21.0.3'),
('kotlin',      '.kt',      '1.9.24'),
('ruby',        '.rb',      '3.2.3'),
('haskell',        '.hs',      '9.4.7'),
('lua',         '.lua',     '5.4.6');

INSERT INTO "categories" (name)
VALUES
('Sorting'),
('Searching'),
('Graph Theory'),
('Dynamic Programming'),
('Greedy Algorithms'),
('Divide and Conquer'),
('Backtracking'),
('Recursion'),
('Arrays'),
('Linked Lists'),
('Stacks'),
('Queues'),
('Trees'),
('Graphs'),
('Hash Tables'),
('Heaps'),
('Number Theory'),
('Combinatorics'),
('Probability'),
('Geometry');

INSERT INTO "users" (name, join_date, email, is_admin)
VALUES 
('JohnEldenRing',   timestamp '2024-01-01 10:00:00', 'joebiden@usa.gov',    'TRUE'),
('JohnDarksouls',   timestamp '2024-02-02 10:00:00', 'grumbus@usa.gov',     'FALSE');

-- deleting these using that API WILL returnd a 500 since they aren't in elastic search
INSERT INTO "problems" (title, prompt, timeout, user_id, difficulty, upload_date)
VALUES
('Invert a String',     'Given a string, print the reverse',    10,     1,  'EASY',         timestamp '2024-03-03 10:00:00'),
('Add two numbers',     'Given two numbers, print the sum',     5,      2,  'VERY HARD',    timestamp '2024-03-04 10:00:00');

INSERT INTO "test_cases" (problem_id, input, expected_output)
VALUES
(1,     'abc',      'cba'),
(1,     '123',      '321'),
(2,     '2 1',      '3'),
(2,     '10 10',    '20');

INSERT INTO "submissions" (user_id, problem_id, time_elapsed, language_id, status, failed_test_case_id, submit_time, source_code)
VALUES
(1,     1,  2,  2,  'COMPILE_TIME_ERROR',    NULL,   timestamp '2024-03-07 10:00:00',    'int main2(){}'),
(2,     2,  2,  1,  'WRONG_ANSWER',          3,      timestamp '2024-03-08 10:00:00',    'int main(){ return 0; }');

INSERT INTO "competitions" (user_id, start_time, end_time, description, title)
VALUES
(1, timestamp '2024-04-19 8:00:00', timestamp '2024-04-19 11:00:00', 'this is a big competition', 'big competition');

INSERT INTO "competition_problems" (competition_id, problem_id)
VALUES
(1, 1),
(1, 2);

INSERT INTO "competition_users" (competition_id, user_id)
VALUES
(1, 1),
(1, 2);

INSERT INTO "problem_categories" (problem_id, category_id)
VALUES
(1, 2),
(1, 3),
(2, 1),
(2, 2);