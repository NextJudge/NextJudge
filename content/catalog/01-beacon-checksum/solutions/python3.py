import sys

word = sys.stdin.read().strip()
print(sum(ord(c) for c in word) % 256)
