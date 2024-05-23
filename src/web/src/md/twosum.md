### Problem Statement

Imagine you're a farmer and you have a list of numbers that represent the weight of your animals. You want to find two animals that together have a weight equal to a target value.

Write a function that receives the list of weights and the target value and returns the indexes of the two animals that have the desired weight.

In this case, the indexes are zero-based.

The problem is to find the indexes of the two animals that have the desired weight.

Ideally, the function should have a time complexity of $O(n)$ and a space complexity of $O(1)$.

## Example:

Given `animals = [2, 7, 11, 15]`, `target = 9`,

The answer is `[0, 1]`, because `animals[0] + animals[1] == 9`.

## Constraints:

- $2 \leq \text{animals.length} \leq 10^4$
- $-10^9 \leq \text{animals[i]} \leq 10^9$
- $-10^9 \leq \text{target} \leq 10^9$
- Only one valid answer exists.

## Open Questions:

- What is the time complexity of the brute force solution?
- Can you think of a more efficient solution?
- Given the constraints, what is the maximum number of elements in the list?

<!--
# Two Sum Problem

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

## Example:

Given `nums = [2, 7, 11, 15]`, `target = 9`,

The answer is `[0, 1]`, because `nums[0] + nums[1] == 9`.

## Constraints:

- $2 \leq \text{nums.length} \leq 10^4$
- $-10^9 \leq \text{nums[i]} \leq 10^9$
- $-10^9 \leq \text{target} \leq 10^9$
- Only one valid answer exists.

## Open Questions:

- Can you do it in linear time and constant space?
- What if the array is sorted?
- How about three numbers?

# Two Sum Problem

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

## Example:

Given `nums = [2, 7, 11, 15]`, `target = 9`,

The answer is `[0, 1]`, because `nums[0] + nums[1] == 9`.

## Constraints:

- $2 \leq \text{nums.length} \leq 10^4$
- $-10^9 \leq \text{nums[i]} \leq 10^9$
- $-10^9 \leq \text{target} \leq 10^9$
- Only one valid answer exists.

## Open Questions:

- Can you do it in linear time and constant space?
- What if the array is sorted?
- How about three numbers?

 -->
