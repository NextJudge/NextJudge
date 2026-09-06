#include <deque>
#include <iostream>
#include <string>
#include <vector>

int main() {
    int rows, cols;
    std::cin >> rows >> cols;

    std::vector<std::string> grid(rows);
    for (int i = 0; i < rows; ++i) {
        std::cin >> grid[i];
    }

    std::pair<int, int> start = {-1, -1};
    std::pair<int, int> goal = {-1, -1};
    for (int i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) {
            if (grid[i][j] == 'S') {
                start = {i, j};
            } else if (grid[i][j] == 'E') {
                goal = {i, j};
            }
        }
    }

    std::vector<std::vector<bool>> seen(rows, std::vector<bool>(cols, false));
    std::deque<std::tuple<int, int, int>> queue;
    queue.push_back({start.first, start.second, 0});
    seen[start.first][start.second] = true;

    const int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    int answer = -1;

    while (!queue.empty()) {
        auto [row, col, dist] = queue.front();
        queue.pop_front();
        if (row == goal.first && col == goal.second) {
            answer = dist;
            break;
        }
        for (const auto &dir : dirs) {
            int nr = row + dir[0];
            int nc = col + dir[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                continue;
            }
            if (grid[nr][nc] == '#' || seen[nr][nc]) {
                continue;
            }
            seen[nr][nc] = true;
            queue.push_back({nr, nc, dist + 1});
        }
    }

    std::cout << answer << '\n';
    return 0;
}
