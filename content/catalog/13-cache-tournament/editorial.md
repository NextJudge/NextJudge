# Cache Tournament — Editorial

## Approach

Build a segment tree for range-maximum queries on a static array. Each query descends
the tree in `O(log n)`.

A sparse table also works for static RMQ; the segment tree is the intended technique.

## Complexity

- **Time:** `O(n + q log n)`
- **Space:** `O(n)`

## Reference (Python)

```python
import sys

class SegTree:
    def __init__(self, values):
        self.n = len(values)
        size = 1
        while size < self.n:
            size <<= 1
        self.size = size
        self.tree = [0] * (2 * size)
        for i, value in enumerate(values):
            self.tree[size + i] = value
        for i in range(size - 1, 0, -1):
            self.tree[i] = max(self.tree[2 * i], self.tree[2 * i + 1])

    def query(self, left, right):
        left += self.size
        right += self.size
        best = 0
        while left <= right:
            if left % 2 == 1:
                best = max(best, self.tree[left])
                left += 1
            if right % 2 == 0:
                best = max(best, self.tree[right])
                right -= 1
            left //= 2
            right //= 2
        return best

lines = sys.stdin.read().strip().splitlines()
n, q = map(int, lines[0].split())
values = list(map(int, lines[1].split()))
tree = SegTree(values)

out = []
for line in lines[2:2 + q]:
    left, right = map(int, line.split())
    out.append(str(tree.query(left - 1, right - 1)))
print("\n".join(out))
```

## Common pitfalls

- Mixing 0-indexed tree positions with 1-indexed query input
- Forgetting to build internal nodes bottom-up
