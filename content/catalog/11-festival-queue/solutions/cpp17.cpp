#include <iostream>
#include <vector>

class Fenwick {
public:
    explicit Fenwick(int size) : size_(size), tree_(size + 1, 0) {}

    void add(int index, int delta) {
        while (index <= size_) {
            tree_[index] += delta;
            index += index & -index;
        }
    }

    int prefix(int index) const {
        int total = 0;
        while (index > 0) {
            total += tree_[index];
            index -= index & -index;
        }
        return total;
    }

private:
    int size_;
    std::vector<int> tree_;
};

int main() {
    int n, m;
    std::cin >> n >> m;

    Fenwick bit(m);
    for (int i = 0; i < n; ++i) {
        int band;
        std::cin >> band;
        bit.add(band, 1);
    }

    int q;
    std::cin >> q;
    while (q--) {
        int x;
        std::cin >> x;
        std::cout << bit.prefix(x) << '\n';
    }

    return 0;
}
