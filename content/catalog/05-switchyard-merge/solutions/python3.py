import sys

lines = sys.stdin.read().strip().splitlines()
m, n = map(int, lines[0].split())
line_idx = 1
left = []
if m > 0:
    left = list(map(int, lines[line_idx].split()))
    line_idx += 1
right = list(map(int, lines[line_idx].split())) if n > 0 else []

i = j = 0
out = []
while i < m and j < n:
    if left[i] <= right[j]:
        out.append(left[i])
        i += 1
    else:
        out.append(right[j])
        j += 1
out.extend(left[i:])
out.extend(right[j:])
print(" ".join(map(str, out)))
