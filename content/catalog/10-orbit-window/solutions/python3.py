import sys
from collections import deque

data = sys.stdin.read().split()
n, k = map(int, data[:2])
values = list(map(int, data[2:2 + n]))

dq = deque()
out = []
for i, value in enumerate(values):
    while dq and dq[0] <= i - k:
        dq.popleft()
    while dq and values[dq[-1]] >= value:
        dq.pop()
    dq.append(i)
    if i >= k - 1:
        out.append(str(values[dq[0]]))
print(" ".join(out))
