import sys

lines = sys.stdin.read().strip().splitlines()
n = int(lines[0])
events = []
for line in lines[1:1 + n]:
    start, end = map(int, line.split())
    events.append((start, 1))
    events.append((end, -1))

events.sort(key=lambda item: (item[0], item[1]))

active = 0
best = 0
for _, delta in events:
    active += delta
    best = max(best, active)
print(best)
