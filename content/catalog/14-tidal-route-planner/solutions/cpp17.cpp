#include <iostream>
#include <queue>
#include <vector>

int main() {
    int n, m;
    std::cin >> n >> m;

    std::vector<std::vector<std::tuple<int, long long, int>>> graph(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v, t;
        long long w;
        std::cin >> u >> v >> w >> t;
        graph[u].push_back({v, w, t});
        graph[v].push_back({u, w, t});
    }

    const long long INF = 4e18;
    std::vector<std::vector<long long>> dist(n + 1, std::vector<long long>(2, INF));
    dist[1][0] = 0;

    using State = std::tuple<long long, int, int>;
    std::priority_queue<State, std::vector<State>, std::greater<State>> heap;
    heap.push({0, 1, 0});

    while (!heap.empty()) {
        auto [cost, node, used] = heap.top();
        heap.pop();
        if (cost != dist[node][used]) {
            continue;
        }
        for (const auto &[nei, weight, edge_type] : graph[node]) {
            if (used == 1 && edge_type == 1) {
                continue;
            }
            int next_used = used | edge_type;
            long long next_cost = cost + weight;
            if (next_cost < dist[nei][next_used]) {
                dist[nei][next_used] = next_cost;
                heap.push({next_cost, nei, next_used});
            }
        }
    }

    long long answer = std::min(dist[n][0], dist[n][1]);
    if (answer >= INF) {
        std::cout << -1 << '\n';
    } else {
        std::cout << answer << '\n';
    }

    return 0;
}
