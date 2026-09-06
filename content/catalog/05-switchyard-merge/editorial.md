# Switchyard Merge — Editorial

## Approach

Classic merge from merge-sort: compare the fronts of both arrays with two pointers,
append the smaller value, and advance that pointer. When one list is exhausted, append
the remainder of the other.

## Complexity

- **Time:** `O(m + n)`
- **Space:** `O(m + n)` for the output (or `O(1)` extra if printing directly)

## Reference (Python)

```python
import sys

lines = sys.stdin.read().strip().splitlines()
m, n = map(int, lines[0].split())
left = list(map(int, lines[1].split()))
right = list(map(int, lines[2].split()))

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
```

## Common pitfalls

- Forgetting to append leftover elements after one list is finished
- Breaking stability unnecessarily (use `<=` on the left side)
