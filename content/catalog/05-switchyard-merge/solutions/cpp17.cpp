#include <iostream>
#include <vector>

int main() {
    int m, n;
    std::cin >> m >> n;

    std::vector<int> left(m), right(n);
    for (int i = 0; i < m; ++i) {
        std::cin >> left[i];
    }
    for (int i = 0; i < n; ++i) {
        std::cin >> right[i];
    }

    int i = 0;
    int j = 0;
    bool first = true;
    while (i < m && j < n) {
        int value = (left[i] <= right[j]) ? left[i++] : right[j++];
        if (!first) {
            std::cout << ' ';
        }
        first = false;
        std::cout << value;
    }
    while (i < m) {
        if (!first) {
            std::cout << ' ';
        }
        first = false;
        std::cout << left[i++];
    }
    while (j < n) {
        if (!first) {
            std::cout << ' ';
        }
        first = false;
        std::cout << right[j++];
    }
    std::cout << '\n';
    return 0;
}
