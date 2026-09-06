# Orbit Window — Editorial

## Approach

Use a monotonic deque storing indices with increasing values. Pop from the back while
the new value is smaller, expire indices outside the window from the front, and read
the minimum from the front.

## Complexity

- **Time:** `O(n)`
- **Space:** `O(k)`

## Reference (Python)

```python
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
```

## Common pitfalls

- Reusing the maximum-window deque logic with the wrong comparison direction
- Off-by-one on when to start emitting answers (`i >= k - 1`)
