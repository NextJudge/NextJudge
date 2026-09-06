# Beacon Checksum — Editorial

## Approach

Read the entire line from standard input, sum the ASCII code of each character, and
print the sum modulo `256`.

There is no special parsing beyond reading one line. Trailing newline characters are
not part of the codeword once we trim the line.

## Complexity

- **Time:** `O(|S|)` — one pass over the string
- **Space:** `O(1)` extra space besides the input

## Reference (Python)

```python
import sys

word = sys.stdin.read().strip()
print(sum(ord(c) for c in word) % 256)
```

## Common pitfalls

- Forgetting modulo `256` when the raw sum is larger than `255`
- Including the trailing newline in the sum (trim the input line first)
