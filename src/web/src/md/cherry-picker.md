# Cherry Picking

You are managing a cherry farm and have a list of cherry trees, each yielding a certain number of cherries. You want to maximize the total number of cherries you can pick in a day by selecting trees in such a way that you pick the maximum number of cherries without exceeding a given limit.

Write a function that receives a list of cherry yields for each tree and a target value representing the maximum number of cherries you can pick. The function should return the indexes of the trees that together yield the maximum number of cherries without exceeding the target.

## Example:

Given `trees = [10, 15, 20, 5, 30]`, `target = 35`,

The answer is `[1, 2]`, because `trees[1] + trees[2] == 35` is the maximum yield that does not exceed 35.

## Constraints:

- $2 \leq \text{trees.length} \leq 10^4$
- $1 \leq \text{trees[i]} \leq 10^9$
- $1 \leq \text{target} \leq 10^9$
- You may not select the same tree more than once.
- There may be multiple solutions, return any one of them.
- If no valid combination is found, return an empty list.

## Advanced:

To make the problem harder, you can add additional constraints:

- You cannot select two adjacent trees.
- The number of trees is so large that a $O(n^2)$ solution is impractical.

## Open Questions:

- What is the time complexity of a brute force solution?
- Can you think of an efficient algorithm to solve this problem?
- How would you handle the constraint of not selecting adjacent trees?

## Example with Advanced Constraints:

Given `trees = [10, 15, 20, 5, 30]`, `target = 35`,

Possible answers can be `[0, 2]` because `trees[0] + trees[2] == 30` which is the maximum yield without selecting adjacent trees and not exceeding the target.

## Function Signature:

```python
def cherry_picker(trees: List[int], target: int) -> List[int]:
    pass
```

Input:

`trees` - List of integers representing the number of cherries each tree yields.
`target` Integer representing the maximum number of cherries that can be picked.

Output:

List of integers representing the indexes of the selected trees.
