import sys
import heapq

data = sys.stdin.read().split()
it = iter(data)
n = int(next(it))
m = int(next(it))

graph = [[] for _ in range(n + 1)]
for _ in range(m):
    u = int(next(it))
    v = int(next(it))
    w = int(next(it))
    t = int(next(it))
    graph[u].append((v, w, t))
    graph[v].append((u, w, t))

INF = 10**30
dist = [[INF, INF] for _ in range(n + 1)]
dist[1][0] = 0
heap = [(0, 1, 0)]

while heap:
    cost, node, used = heapq.heappop(heap)
    if cost != dist[node][used]:
        continue
    for nei, weight, edge_type in graph[node]:
        if used == 1 and edge_type == 1:
            continue
        next_used = used | edge_type
        next_cost = cost + weight
        if next_cost < dist[nei][next_used]:
            dist[nei][next_used] = next_cost
            heapq.heappush(heap, (next_cost, nei, next_used))

answer = min(dist[n][0], dist[n][1])
print(-1 if answer >= INF else answer)
