#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;

    std::vector<std::pair<long long, int>> events;
    events.reserve(2 * n);
    for (int i = 0; i < n; ++i) {
        long long start, end;
        std::cin >> start >> end;
        events.push_back({start, 1});
        events.push_back({end, -1});
    }

    std::sort(events.begin(), events.end(), [](const auto &a, const auto &b) {
        if (a.first != b.first) {
            return a.first < b.first;
        }
        return a.second < b.second;
    });

    int active = 0;
    int best = 0;
    for (const auto &[time, delta] : events) {
        active += delta;
        best = std::max(best, active);
    }

    std::cout << best << '\n';
    return 0;
}
