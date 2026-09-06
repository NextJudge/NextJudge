# Archive Deduplicator — Editorial

## Approach

Insert every title into a hash set and print the set size.

## Complexity

- **Time:** `O(n · L)` where `L` is average string length
- **Space:** `O(n · L)`

## Reference (Python)

```python
import sys

lines = sys.stdin.read().strip().splitlines()
n = int(lines[0])
print(len(set(lines[1:1 + n])))
```

## Common pitfalls

- Counting total lines instead of unique values
- Case folding when the problem is case-sensitive
