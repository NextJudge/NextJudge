import { useState } from "react";

import { Navbar } from "./problem";

type Problem = {
  id: string;
  difficulty: string;
  description: string;
  name: string;
};

type ProblemProps = {
  problem: Problem;
};

const problems: Problem[] = [
  { id: "1", difficulty: "easy", description: "Add two numbers", name: "Sum" },
  {
    id: "2",
    difficulty: "medium",
    description: "Multiply two numbers",
    name: "Product",
  },
  {
    id: "3",
    difficulty: "hard",
    description: "Find the largest prime number",
    name: "Largest Prime",
  },
  {
    id: "4",
    difficulty: "easy",
    description: "Subtract two numbers",
    name: "Difference",
  },
  {
    id: "5",
    difficulty: "medium",
    description: "Divide two numbers",
    name: "Quotient",
  },
  {
    id: "6",
    difficulty: "hard",
    description: "Calculate the square root",
    name: "Square Root",
  },
  {
    id: "7",
    difficulty: "easy",
    description: "Concatenate two strings",
    name: "String Concatenation",
  },
  {
    id: "8",
    difficulty: "medium",
    description: "Check if a number is even",
    name: "Even Number Check",
  },
  {
    id: "9",
    difficulty: "hard",
    description: "Sort an array of numbers",
    name: "Array Sorting",
  },
  {
    id: "10",
    difficulty: "easy",
    description: "Calculate the area of a rectangle",
    name: "Rectangle Area",
  },
  {
    id: "11",
    difficulty: "medium",
    description: "Find the average of an array",
    name: "Average Calculation",
  },
  {
    id: "12",
    difficulty: "hard",
    description: "Implement binary search",
    name: "Binary Search",
  },
  {
    id: "13",
    difficulty: "easy",
    description: "Check if a string is a palindrome",
    name: "Palindrome Check",
  },
  {
    id: "14",
    difficulty: "medium",
    description: "Reverse a linked list",
    name: "Linked List Reversal",
  },
  {
    id: "15",
    difficulty: "hard",
    description: "Implement a hash table",
    name: "Hash Table Implementation",
  },
  {
    id: "16",
    difficulty: "easy",
    description: "Convert Celsius to Fahrenheit",
    name: "Temperature Conversion",
  },
  {
    id: "17",
    difficulty: "medium",
    description: "Find the factorial of a number",
    name: "Factorial Calculation",
  },
  {
    id: "18",
    difficulty: "hard",
    description: "Implement quicksort algorithm",
    name: "Quicksort Implementation",
  },
  {
    id: "19",
    difficulty: "easy",
    description: "Check if a number is a prime",
    name: "Prime Number Check",
  },
  {
    id: "20",
    difficulty: "medium",
    description: "Implement depth-first search",
    name: "Depth-First Search",
  },
  {
    id: "21",
    difficulty: "hard",
    description: "Implement Dijkstra's algorithm",
    name: "Dijkstra's Algorithm",
  },
  {
    id: "22",
    difficulty: "easy",
    description: "Reverse a string",
    name: "String Reversal",
  },
  {
    id: "23",
    difficulty: "medium",
    description: "Find the GCD of two numbers",
    name: "GCD Calculation",
  },
  {
    id: "24",
    difficulty: "hard",
    description: "Implement a priority queue",
    name: "Priority Queue Implementation",
  },
  {
    id: "25",
    difficulty: "easy",
    description: "Check if a number is a perfect square",
    name: "Perfect Square Check",
  },
  {
    id: "26",
    difficulty: "medium",
    description: "Implement breadth-first search",
    name: "Breadth-First Search",
  },
  {
    id: "27",
    difficulty: "hard",
    description: "Implement the merge sort algorithm",
    name: "Merge Sort Implementation",
  },
  {
    id: "28",
    difficulty: "easy",
    description: "Count vowels in a string",
    name: "Vowel Count",
  },
  {
    id: "29",
    difficulty: "medium",
    description: "Find the power of a number",
    name: "Power Calculation",
  },
  {
    id: "30",
    difficulty: "hard",
    description: "Implement a red-black tree",
    name: "Red-Black Tree Implementation",
  },
];

const getBadgeStyling = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500";
    case "medium":
      return "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500";
    case "hard":
      return "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500";
    default:
      return "bg-gray-500";
  }
};

export default function Problems() {
  const [problemList] = useState<Problem[]>(problems);

  return (
    <>
      <Navbar fixed={true} />
      <main className="layout w-full bg-black bg-fixed text-white selection:bg-white selection:text-black">
        <section className="container px-4 md:px-3 md:pt-8 lg:pt-12 xl:pt-16">
          <div className="flex flex-col justify-start space-y-4 text-center">
            <h1 className="mx-auto text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
              Problem List
            </h1>

            <div className="mb-2 space-y-4">
              <p className="text-md mx-auto max-w-3xl text-zinc-200 sm:text-base md:text-xl">
                Try to solve these problems to improve your programming skills.
              </p>
            </div>
          </div>

          <div className="shadow-xs my-12 w-full overflow-hidden rounded-lg p-4">
            <div className="w-full overflow-x-auto">
              <table className="whitespace-no-wrap w-full rounded-lg">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">Problem ID</th>
                    <th className="px-4 py-3">Problem Name</th>
                    <th className="px-4 py-3">Problem Description</th>
                    <th className="px-4 py-3">Problem Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {problemList.map((problem: Problem) => (
                    <tr
                      key={problem.id}
                      className="cursor-pointer text-gray-100 transition duration-100 hover:bg-gray-200/20"
                      onClick={() => {
                        window.location.href = `/problem/${problem.id}`;
                      }}
                    >
                      <td className="px-4 py-3">{problem.id}</td>
                      <td className="px-4 py-3">{problem.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {problem.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getBadgeStyling(problem.difficulty)}>
                          {problem.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
