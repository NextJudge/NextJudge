# Lantern Range — Editorial

## Approach

Compute prefix sums `pref[i] = a_1 + … + a_i` with `pref[0] = 0`. The answer for
`[L, R]` is `pref[R] - pref[L - 1]`.

## Complexity

- **Time:** `O(n + q)`
- **Space:** `O(n)`

## Reference (Python)

```python
import sys

lines = sys.stdin.read().strip().splitlines()
n = int(lines[0])
values = list(map(int, lines[1].split()))
q = int(lines[2])

pref = [0]
for value in values:
    pref.append(pref[-1] + value)

out = []
for line in lines[3:3 + q]:
    left, right = map(int, line.split())
    out.append(str(pref[right] - pref[left - 1]))
print("\n".join(out))
```

## Common pitfalls

- Forgetting that queries are 1-indexed
- Integer overflow when sums are large (use 64-bit integers)
