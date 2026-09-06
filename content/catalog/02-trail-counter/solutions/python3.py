import sys

data = sys.stdin.read().split()
n = int(data[0])
counts = list(map(int, data[1:1 + n]))
threshold = int(data[1 + n])
print(sum(1 for x in counts if x >= threshold))
