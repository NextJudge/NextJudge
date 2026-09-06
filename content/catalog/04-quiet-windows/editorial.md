# Quiet Windows — Editorial

## Approach

Maintain a deque of indices whose values are decreasing. For each new position `i`,
drop indices from the front that fall outside the window `[i - k + 1, i]`, then drop
indices from the back whose values are smaller than `a[i]`. The front index holds the
window maximum.

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
    while dq and values[dq[-1]] <= value:
        dq.pop()
    dq.append(i)
    if i >= k - 1:
        out.append(str(values[dq[0]]))
print(" ".join(out))
```

## Common pitfalls

- Forgetting to remove expired indices from the front of the deque
- Using `O(nk)` brute force on large inputs
