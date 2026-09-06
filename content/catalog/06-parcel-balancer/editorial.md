# Parcel Balancer — Editorial

## Approach

Sort weights descending, then first-fit: try each open box in creation order and place
the parcel in the first box with enough remaining space. If none fit, start a new box.

This is a standard greedy heuristic for bin packing (not always optimal in general, but
it is optimal for this problem's constraints as stated with the prescribed rule).

## Complexity

- **Time:** `O(n^2)` with a simple list of remaining capacities — sufficient for the limits
- **Space:** `O(n)`

## Reference (Python)

```python
import sys

data = sys.stdin.read().split()
n, capacity = map(int, data[:2])
weights = sorted(map(int, data[2:2 + n]), reverse=True)

boxes = []
for weight in weights:
    placed = False
    for i in range(len(boxes)):
        if boxes[i] >= weight:
            boxes[i] -= weight
            placed = True
            break
    if not placed:
        boxes.append(capacity - weight)
print(len(boxes))
```

## Common pitfalls

- Sorting in the wrong direction (lightest first performs worse)
- Forgetting that each parcel must fit entirely (`weight ≤ W` is guaranteed)
