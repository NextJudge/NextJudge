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
