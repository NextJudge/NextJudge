# Bridge Inspection — Editorial

## Approach

Run Tarjan's bridge-finding DFS. Track discovery time `disc[v]` and low-link `low[v]`.
An edge `(u, v)` with `v` visited and `low[v] > disc[u]` is a bridge.

## Complexity

- **Time:** `O(n + m)`
- **Space:** `O(n + m)`

## Reference (Python)

```python
import sys
sys.setrecursionlimit(1_000_000)

data = sys.stdin.read().split()
it = iter(data)
n = int(next(it))
m = int(next(it))

graph = [[] for _ in range(n + 1)]
for _ in range(m):
    u = int(next(it))
    v = int(next(it))
    graph[u].append(v)
    graph[v].append(u)

disc = [0] * (n + 1)
low = [0] * (n + 1)
timer = 1
bridges = 0

def dfs(node, parent):
    global timer, bridges
    disc[node] = low[node] = timer
    timer += 1
    for nei in graph[node]:
        if disc[nei] == 0:
            dfs(nei, node)
            low[node] = min(low[node], low[nei])
            if low[nei] > disc[node]:
                bridges += 1
        elif nei != parent:
            low[node] = min(low[node], disc[nei])

dfs(1, 0)
print(bridges)
```

## Common pitfalls

- Forgetting to skip the parent edge in DFS
- Counting each bridge twice (only evaluate tree edges)
