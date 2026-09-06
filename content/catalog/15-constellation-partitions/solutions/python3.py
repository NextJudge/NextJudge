import sys

def divisors(total):
    small = []
    large = []
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
