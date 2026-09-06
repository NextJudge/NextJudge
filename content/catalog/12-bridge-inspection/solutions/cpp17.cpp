#include <algorithm>
#include <iostream>
#include <vector>

int timer = 1;
int bridges = 0;

void dfs(
    int node,
    int parent,
    const std::vector<std::vector<int>> &graph,
    std::vector<int> &disc,
    std::vector<int> &low
) {
    disc[node] = low[node] = timer++;
    for (int nei : graph[node]) {
        if (disc[nei] == 0) {
            dfs(nei, node, graph, disc, low);
            low[node] = std::min(low[node], low[nei]);
            if (low[nei] > disc[node]) {
                ++bridges;
            }
        } else if (nei != parent) {
            low[node] = std::min(low[node], disc[nei]);
        }
    }
}

int main() {
    int n, m;
    std::cin >> n >> m;

    std::vector<std::vector<int>> graph(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    std::vector<int> disc(n + 1, 0);
    std::vector<int> low(n + 1, 0);
    dfs(1, 0, graph, disc, low);

    std::cout << bridges << '\n';
    return 0;
}
