#include <iostream>
#include <vector>

std::vector<long long> divisors(long long total) {
    std::vector<long long> small;
    std::vector<long long> large;
    for (long long d = 1; d * d <= total; ++d) {
        if (total % d == 0) {
            small.push_back(d);
            if (d * d != total) {
                large.push_back(total / d);
            }
        }
    }
    for (int i = static_cast<int>(large.size()) - 1; i >= 0; --i) {
        small.push_back(large[i]);
    }
    return small;
}

int main() {
    int n;
    std::cin >> n;

    std::vector<long long> values(n);
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
        total += values[i];
    }

    int answer = 0;
    for (long long target : divisors(total)) {
        long long running = 0;
        bool ok = true;
        for (long long value : values) {
            running += value;
            if (running == target) {
                running = 0;
            } else if (running > target) {
                ok = false;
                break;
            }
        }
        if (ok && running == 0) {
            ++answer;
        }
    }

    std::cout << answer << '\n';
    return 0;
}
