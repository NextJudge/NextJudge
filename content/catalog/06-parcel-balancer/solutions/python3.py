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
