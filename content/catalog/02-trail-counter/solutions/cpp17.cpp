#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;

    std::vector<long long> values(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }

    int threshold;
    std::cin >> threshold;

    int answer = 0;
    for (int value : values) {
        if (value >= threshold) {
            ++answer;
        }
    }

    std::cout << answer << '\n';
    return 0;
}
