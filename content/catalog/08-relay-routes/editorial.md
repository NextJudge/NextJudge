# Relay Routes — Editorial

## Approach

Breadth-first search from `S`. BFS on an unweighted grid finds the shortest number of
steps. Track visited cells to avoid revisiting.

## Complexity

- **Time:** `O(r · c)`
- **Space:** `O(r · c)`

## Reference (Python)

```python
import sys
from collections import deque

lines = sys.stdin.read().strip().splitlines()
r, c = map(int, lines[0].split())
grid = lines[1:1 + r]

start = goal = None
for i in range(r):
    for j in range(c):
        if grid[i][j] == 'S':
            start = (i, j)
        elif grid[i][j] == 'E':
            goal = (i, j)

dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
queue = deque([(start[0], start[1], 0)])
seen = {start}

while queue:
    row, col, dist = queue.popleft()
    if (row, col) == goal:
        print(dist)
        break
    for dr, dc in dirs:
        nr, nc = row + dr, col + dc
        if 0 <= nr < r and 0 <= nc < c and grid[nr][nc] != '#' and (nr, nc) not in seen:
            seen.add((nr, nc))
            queue.append((nr, nc, dist + 1))
else:
    print(-1)
```

## Common pitfalls

- Forgetting that `S` and `E` are walkable cells
- Using DFS instead of BFS (DFS does not guarantee shortest path)
