#include <iostream>
#include <string>
#include <unordered_set>

int main() {
    int n;
    std::cin >> n;

    std::unordered_set<std::string> seen;
    for (int i = 0; i < n; ++i) {
        std::string value;
        std::cin >> value;
        seen.insert(value);
    }

    std::cout << seen.size() << '\n';
    return 0;
}
