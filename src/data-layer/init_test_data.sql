INSERT INTO "language" (name, extension, version)
VALUES
('c++',     '.cpp',     '14'),
('c',       '.c',       '-1'),
('python',  '.py',      '3.12'),
('rust',    '.rs',      '1.71.0');

INSERT INTO "user" (username, password_hash, join_date, is_admin)
VALUES 
('JohnEldenRing',   'abcd123',  timestamp '2024-01-01 10:00:00',    'TRUE'),
('JohnDarksouls',   '1234zyx',  timestamp '2024-02-02 10:00:00',    'FALSE');

INSERT INTO "problem" (title, prompt, timeout, user_id, upload_date)
VALUES
('Invert a String',     'Given a string, print the reverse',    10,     1,  timestamp '2024-03-03 10:00:00'),
('Add two numbers',     'Given two numbers, print the sum',     5,      2,  timestamp '2024-03-04 10:00:00');

INSERT INTO "test_case" (problem_id, input, expected_output)
VALUES
(1,     'abc',      'cba'),
(1,     '123',      '321'),
(2,     '2 1',      '3'),
(2,     '10 10',    '20');

INSERT INTO "submission" (user_id, problem_id, time_elapsed, language_id, status, failed_test_case_id, submit_time, source_code)
VALUES
(1,     1,  2,  2,  'COMPILE_TIME_ERROR',    NULL,   timestamp '2024-03-07 10:00:00',    'int main2(){}'),
(2,     2,  2,  1,  'WRONG_ANSWER',          3,      timestamp '2024-03-08 10:00:00',    'int main(){ return 0; }');