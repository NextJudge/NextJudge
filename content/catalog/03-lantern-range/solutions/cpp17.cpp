#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;

    std::vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long value;
        std::cin >> value;
        pref[i] = pref[i - 1] + value;
    }

    int q;
    std::cin >> q;
    while (q--) {
        int left, right;
        std::cin >> left >> right;
        std::cout << pref[right] - pref[left - 1] << '\n';
    }

    return 0;
}
