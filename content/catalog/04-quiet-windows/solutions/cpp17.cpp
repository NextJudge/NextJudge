#include <deque>
#include <iostream>
#include <vector>

int main() {
    int n, k;
    std::cin >> n >> k;

    std::vector<long long> values(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }

    std::deque<int> dq;
    bool first = true;
    for (int i = 0; i < n; ++i) {
        while (!dq.empty() && dq.front() <= i - k) {
            dq.pop_front();
        }
        while (!dq.empty() && values[dq.back()] <= values[i]) {
            dq.pop_back();
        }
        dq.push_back(i);
        if (i >= k - 1) {
            if (!first) {
                std::cout << ' ';
            }
            first = false;
            std::cout << values[dq.front()];
        }
    }
    std::cout << '\n';
    return 0;
}
