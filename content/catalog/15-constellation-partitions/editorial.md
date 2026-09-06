# Constellation Partitions — Editorial

## Approach

Let `S` be the total sum. Any valid target `T` must divide `S`. For each divisor `T` of
`S`, scan left to right accumulating a running sum; whenever it reaches `T`, start a new
group. The target is valid iff every element is consumed and no prefix exceeds `T`.

This is `O(n · d)` where `d` is the number of divisors of `S` (small in practice).

## Complexity

- **Time:** `O(n · d)` where `d` is the number of divisors of the total sum
- **Space:** `O(1)` extra

## Reference (Python)

```python
import sys

def divisors(total):
    small, large = [], []
    d = 1
    while d * d <= total:
        if total % d == 0:
            small.append(d)
            if d * d != total:
                large.append(total // d)
        d += 1
    return small + large[::-1]

data = sys.stdin.read().split()
n = int(data[0])
values = list(map(int, data[1:1 + n]))
total = sum(values)

answer = 0
for target in divisors(total):
    running = 0
    ok = True
    for value in values:
        running += value
        if running == target:
            running = 0
        elif running > target:
            ok = False
            break
    if ok and running == 0:
        answer += 1
print(answer)
```

## Common pitfalls

- Counting divisors that fail because a prefix sum overshoots the target
- Forgetting that the whole-array partition always uses target `S`
