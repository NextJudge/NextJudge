#include <algorithm>
#include <iostream>
#include <vector>

class SegTree {
public:
    explicit SegTree(const std::vector<long long> &values) {
        n_ = values.size();
        size_ = 1;
        while (size_ < n_) {
            size_ <<= 1;
        }
        tree_.assign(2 * size_, 0);
        for (int i = 0; i < n_; ++i) {
            tree_[size_ + i] = values[i];
        }
        for (int i = size_ - 1; i > 0; --i) {
            tree_[i] = std::max(tree_[2 * i], tree_[2 * i + 1]);
        }
    }

    long long query(int left, int right) const {
        left += size_;
        right += size_;
        long long best = 0;
        while (left <= right) {
            if (left % 2 == 1) {
                best = std::max(best, tree_[left]);
                ++left;
            }
            if (right % 2 == 0) {
                best = std::max(best, tree_[right]);
                --right;
            }
            left /= 2;
            right /= 2;
        }
        return best;
    }

private:
    int n_;
    int size_;
    std::vector<long long> tree_;
};

int main() {
    int n, q;
    std::cin >> n >> q;

    std::vector<long long> values(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> values[i];
    }

    SegTree tree(values);
    while (q--) {
        int left, right;
        std::cin >> left >> right;
        std::cout << tree.query(left - 1, right - 1) << '\n';
    }

    return 0;
}
