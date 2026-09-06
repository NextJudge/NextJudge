import sys
from collections import deque

lines = sys.stdin.read().strip().splitlines()
r, c = map(int, lines[0].split())
grid = lines[1:1 + r]

start = None
goal = None
for i in range(r):
    for j in range(c):
        if grid[i][j] == "S":
            start = (i, j)
        elif grid[i][j] == "E":
            goal = (i, j)

dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
queue = deque([(start[0], start[1], 0)])
seen = {start}

answer = -1
while queue:
    row, col, dist = queue.popleft()
    if (row, col) == goal:
        answer = dist
        break
    for dr, dc in dirs:
        nr, nc = row + dr, col + dc
        if 0 <= nr < r and 0 <= nc < c and grid[nr][nc] != "#" and (nr, nc) not in seen:
            seen.add((nr, nc))
            queue.append((nr, nc, dist + 1))

print(answer)
