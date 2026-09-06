# Trail Counter — Editorial

## Approach

Scan the array once and increment a counter whenever the current value is at least `T`.

## Complexity

- **Time:** `O(n)`
- **Space:** `O(1)` extra

## Reference (Python)

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
counts = list(map(int, data[1:1 + n]))
threshold = int(data[1 + n])
print(sum(1 for x in counts if x >= threshold))
```

## Common pitfalls

- Using `>` instead of `≥`
- Off-by-one errors when parsing the three input lines
