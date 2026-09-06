# Festival Queue — Editorial

## Approach

Build a frequency array `freq[v]` of how many times each band number was sold. A Fenwick
tree (binary indexed tree) over `freq` supports prefix sums: the answer for `x` is the sum
of frequencies for values `1 … x`.

Alternatively, sort the sales once and binary-search each query; the Fenwick tree is the
intended learning goal.

## Complexity

- **Time:** `O((n + q) log m)`
- **Space:** `O(m)`

## Reference (Python)

```python
import sys

class Fenwick:
    def __init__(self, size):
        self.size = size
        self.tree = [0] * (size + 1)

    def add(self, index, delta):
        while index <= self.size:
            self.tree[index] += delta
            index += index & -index

    def prefix(self, index):
        total = 0
        while index > 0:
            total += self.tree[index]
            index -= index & -index
        return total

lines = sys.stdin.read().strip().splitlines()
n, m = map(int, lines[0].split())
sales = list(map(int, lines[1].split()))
q = int(lines[2])

bit = Fenwick(m)
for band in sales:
    bit.add(band, 1)

out = []
for line in lines[3:3 + q]:
    x = int(line)
    out.append(str(bit.prefix(x)))
print("\n".join(out))
```

## Common pitfalls

- Off-by-one on 1-indexed Fenwick positions
- Forgetting duplicate sales increment frequency by more than one
