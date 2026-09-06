import sys

lines = sys.stdin.read().strip().splitlines()
n = int(lines[0])
print(len(set(lines[1:1 + n])))
