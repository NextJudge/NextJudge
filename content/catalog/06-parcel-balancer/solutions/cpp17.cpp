#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    long long capacity;
    std::cin >> n >> capacity;

    std::vector<long long> weights(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> weights[i];
    }
    std::sort(weights.begin(), weights.end(), std::greater<long long>());

    std::vector<long long> boxes;
    for (long long weight : weights) {
        bool placed = false;
        for (long long &remaining : boxes) {
            if (remaining >= weight) {
                remaining -= weight;
                placed = true;
                break;
            }
        }
        if (!placed) {
            boxes.push_back(capacity - weight);
        }
    }

    std::cout << boxes.size() << '\n';
    return 0;
}
