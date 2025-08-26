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
('haskell',     '.hs',      '9.4.7'),
('lua',         '.lua',     '5.4.6')
ON CONFLICT (name) DO NOTHING;

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
('Geometry')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "users" (name, account_identifier, join_date, email, is_admin)
VALUES
('JohnEldenRing',  'test-JohnEldenRing', timestamp '2024-01-01 10:00:00', 'joe@example.com',    'TRUE'),
('JohnDarksouls',  'test-JohnDarksouls', timestamp '2024-02-02 10:00:00', 'bob@example.com',     'FALSE')
ON CONFLICT (account_identifier) DO NOTHING;

-- Insert problem descriptions with rich markdown content
INSERT INTO "problem_descriptions" (title, identifier, prompt, difficulty, user_id, upload_date, default_accept_timeout, default_execution_timeout, default_memory_limit, public)
VALUES
('Reverse String',     'reverse-string',     'Write a function that reverses a string. The input string is given as an array of characters `s`.

You must do this by modifying the input array **in-place** with `O(1)` extra memory.

## Example 1:

**Input:** `s = ["h","e","l","l","o"]`
**Output:** `["o","l","l","e","h"]`

## Example 2:

**Input:** `s = ["H","a","n","n","a","h"]`
**Output:** `["h","a","n","n","a","H"]`

## Constraints:

- $1 \leq \text{s.length} \leq 10^5$
- `s[i]` is a printable ASCII character.

## Function Signature:

```python
def reverseString(s: List[str]) -> None:
    """
    Do not return anything, modify s in-place instead.
    """
    pass
```

**Input:** A list of characters representing the string to reverse.
**Output:** The function should modify the input list in-place.',    'EASY',         (SELECT "id" FROM "users" WHERE name='JohnEldenRing'),  timestamp '2024-03-03 10:00:00', 10.0, 5.0, 256, true),

('Two Sum',     'two-sum',       '# Two Sum

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

## Example 1:

**Input:** `nums = [2,7,11,15]`, `target = 9`
**Output:** `[0,1]`
**Explanation:** Because `nums[0] + nums[1] == 9`, we return `[0, 1]`.

## Example 2:

**Input:** `nums = [3,2,4]`, `target = 6`
**Output:** `[1,2]`

## Example 3:

**Input:** `nums = [3,3]`, `target = 6`
**Output:** `[0,1]`

## Constraints:

- $2 \leq \text{nums.length} \leq 10^4$
- $-10^9 \leq \text{nums[i]} \leq 10^9$
- $-10^9 \leq \text{target} \leq 10^9$
- **Only one valid answer exists.**

## Follow-up:

Can you come up with an algorithm that is less than $O(n^2)$ time complexity?

## Function Signature:

```python
def twoSum(nums: List[int], target: int) -> List[int]:
    pass
```

**Input:** An array of integers `nums` and an integer `target`.
**Output:** A list of two indices that sum to the target.',     'MEDIUM',    (SELECT "id" FROM "users" WHERE name='JohnDarksouls'),  timestamp '2024-03-04 10:00:00', 5.0, 3.0, 128, true)
ON CONFLICT (identifier) DO NOTHING;

INSERT INTO "test_cases" (problem_id, input, expected_output, hidden)
VALUES
((SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'),     'hello',      'olleh',  'FALSE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'),     'world',      'dlrow',  'FALSE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'),     'a',          'a',      'TRUE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'),     'ab',         'ba',     'TRUE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'),     '2 7 11 15
9',      '0 1',    'FALSE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'),     '3 2 4
6',      '1 2',    'FALSE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'),     '3 3
6',      '0 1',   'TRUE'),
((SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'),     '-1 -2 -3 -4 -5
-8',    '2 4',   'TRUE')
ON CONFLICT DO NOTHING;

-- Problems are now standalone entities, no need for a "general event"

-- Insert events (competitions)
INSERT INTO "events" (user_id, title, description, start_time, end_time, teams)
SELECT user_id, title, description, start_time, end_time, teams
FROM (VALUES
    ((SELECT "id" FROM "users" WHERE name='JohnEldenRing'), 'big competition', 'this is a big competition', timestamp '2024-04-19 8:00:00', timestamp '2024-04-19 11:00:00', false)
) AS t(user_id, title, description, start_time, end_time, teams)
WHERE NOT EXISTS (SELECT 1 FROM "events" WHERE title = t.title);

-- No longer need to insert problems into a "general event" - they're public via the public flag

-- Insert event problems for competition
INSERT INTO "event_problems" (event_id, problem_id, hidden, accept_timeout, execution_timeout, memory_limit)
SELECT event_id, problem_id, hidden, accept_timeout, execution_timeout, memory_limit
FROM (VALUES
    ((SELECT "id" FROM "events" WHERE title='big competition'), (SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'), false, 10.0, 5.0, 256),
    ((SELECT "id" FROM "events" WHERE title='big competition'), (SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'), false, 5.0, 3.0, 128)
) AS t(event_id, problem_id, hidden, accept_timeout, execution_timeout, memory_limit)
WHERE t.event_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "event_problems" ep
    WHERE ep.event_id = t.event_id AND ep.problem_id = t.problem_id
);

-- Insert event users
INSERT INTO "event_users" (event_id, user_id)
SELECT event_id, user_id
FROM (VALUES
    ((SELECT "id" FROM "events" WHERE title='big competition'), (SELECT "id" FROM "users" WHERE name='JohnEldenRing')),
    ((SELECT "id" FROM "events" WHERE title='big competition'), (SELECT "id" FROM "users" WHERE name='JohnDarksouls'))
) AS t(event_id, user_id)
WHERE t.event_id IS NOT NULL AND t.user_id IS NOT NULL
ON CONFLICT (user_id, event_id) DO NOTHING;

-- Insert sample submissions (for competition event problems only)
-- Note: We need actual event_problems to exist for submissions to reference

INSERT INTO "problem_categories" (problem_id, category_id)
SELECT problem_id, category_id
FROM (VALUES
    ((SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'), (SELECT "id" FROM "categories" WHERE name='Arrays')),
    ((SELECT "id" FROM "problem_descriptions" WHERE title='Reverse String'), (SELECT "id" FROM "categories" WHERE name='Recursion')),
    ((SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'), (SELECT "id" FROM "categories" WHERE name='Arrays')),
    ((SELECT "id" FROM "problem_descriptions" WHERE title='Two Sum'), (SELECT "id" FROM "categories" WHERE name='Hash Tables'))
) AS t(problem_id, category_id)
WHERE t.problem_id IS NOT NULL AND t.category_id IS NOT NULL
ON CONFLICT (category_id, problem_id) DO NOTHING;