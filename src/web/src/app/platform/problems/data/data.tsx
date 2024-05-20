import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";
import { Problem, RecentSubmission } from "./schema";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "backlog",
    label: "Backlog",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "todo",
    label: "Todo",
    icon: CircleIcon,
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: StopwatchIcon,
  },
  {
    value: "done",
    label: "Done",
    icon: CheckCircledIcon,
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: CrossCircledIcon,
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
  },
];

export const problems: Problem[] = [
  {
    id: "problem-1",
    title: "Array Manipulation",
    description:
      "Given an array of integers, perform various operations on it.",
    status: "open",
    submissions: 10,
    author: "Alice",
  },
  {
    id: "problem-2",
    title: "String Reversal",
    description: "Write a function to reverse a given string.",
    status: "closed",
    submissions: 20,
    author: "Bob",
  },
  {
    id: "problem-3",
    title: "Is Palindrome",
    description: "Determine if a given string is a palindrome or not.",
    status: "open",
    submissions: 15,
    author: "Charlie",
  },
  {
    id: "problem-4",
    title: "Linked List Implementation",
    description: "Implement a linked list data structure.",
    status: "open",
    submissions: 8,
    author: "David",
  },
  {
    id: "problem-5",
    title: "Binary Search Tree",
    description: "Implement operations on a binary search tree.",
    status: "closed",
    submissions: 25,
    author: "Eve",
  },
];

export const problemsTwo: any[] = [
  {
    id: 1,
    title: "Two Sum",
    prompt: "Find the indicies of two numbers that add to sum.",
    timeout: 1000,
    user_id: 1,
    upload_date: new Date(),
    author: "LeetCode",
  },
];

// generate aan array with 5 random dates within the past [one hour, one day, one week, one month, one year]
const getDate = () => {
  let date = new Date();
  let random = Math.floor(Math.random() * 5);
  let time = 0;
  switch (random) {
    case 0:
      time = Math.floor(Math.random() * 3600);
      break;
    case 1:
      time = Math.floor(Math.random() * 86400);
      break;
    case 2:
      time = Math.floor(Math.random() * 604800);
      break;
    case 3:
      time = Math.floor(Math.random() * 2629743);
      break;
    case 4:
      time = Math.floor(Math.random() * 31556926);
      break;
  }
  date.setSeconds(date.getSeconds() - time);
  return date;
};

export const recentSubmissions: RecentSubmission[] = [
  {
    id: "submission-1",
    time: new Date(),
    problem: problems[0],
    language: "JavaScript",
    status: "accepted",
  },
  {
    id: "submission-2",
    time: getDate(),
    problem: problems[1],
    language: "Python",
    status: "rejected",
  },
  {
    id: "submission-3",
    time: getDate(),
    problem: problems[2],
    language: "C++",
    status: "pending",
  },
  {
    id: "submission-4",
    time: getDate(),
    problem: problems[3],
    language: "Java",
    status: "accepted",
  },
  {
    id: "submission-5",
    time: getDate(),
    problem: problems[4],
    language: "C",
    status: "rejected",
  },
];

export const serverRenderRecents: RecentSubmission[] = [
  {
    id: "submission-1",
    time: "2024-03-02T00:00:00Z" as unknown as Date,
    problem: problems[3],
    language: "Go",
    status: "rejected",
  },
  {
    id: "submission-4",
    time: "2024-03-12T00:00:00Z" as unknown as Date,
    problem: problems[2],
    language: "Swift",
    status: "accepted",
  },
  {
    id: "submission-5",
    time: "2024-02-22T00:00:00Z" as unknown as Date,
    problem: problems[4],
    language: "JavaScript",
    status: "pending",
  },
  {
    id: "submission-6",
    time: "2024-03-17T00:00:00Z" as unknown as Date,
    problem: problems[1],
    language: "Rust",
    status: "accepted",
  },
];
