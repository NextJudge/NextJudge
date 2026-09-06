#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);

    long sum = 0;
    for (unsigned char c : line) {
        sum += c;
    }

    std::cout << (sum % 256) << '\n';
    return 0;
}
