import { Submission } from "@/lib/types";
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


// Dummy data
export const recentSubmissions: Submission[] = [
  {
    id: "submission-1",
    problem: problemsTwo[0],
    language: { name:"javascript" } as any,
    status: "ACCEPTED",

    source_code:"1",
    stdout:"",
    stderr:"",
    submit_time: getDate().toLocaleTimeString(),
    language_id: "1",
    problem_id:1,
    time_elapsed:1,
    user_id:"1",

  },
  {
    id: "submission-2",
    problem: problemsTwo[0],
    language: { name: "Python" } as any,
    status: "MEMORY_LIMIT_EXCEEDED",

    source_code:"1",
    stdout:"",
    stderr:"",
    submit_time: getDate().toLocaleTimeString(),
    language_id: "1",
    problem_id:1,
    time_elapsed:1,
    user_id:"1",

  },
  {
    id: "submission-3",
    problem: problemsTwo[0],
    language: {name:"C++"} as any,
    status: "PENDING",

    source_code:"1",
    stdout:"",
    stderr:"",
    submit_time: getDate().toLocaleTimeString(),
    language_id: "1",
    problem_id:1,
    time_elapsed:1,
    user_id:"1"
  },
  {
    id: "submission-4",
    problem: problemsTwo[0],
    language: { name: "Java"} as any,
    status: "ACCEPTED",
    
    source_code:"1",
    stdout:"",
    stderr:"",
    submit_time: getDate().toLocaleTimeString(),
    language_id: "1",
    problem_id:1,
    time_elapsed:1,
    user_id:"1"
  },
  {
    id: "submission-5",
    problem: problemsTwo[0],
    language: {name:"C"} as any,
    status: "COMPILE_TIME_ERROR",

    source_code:"1",
    stdout:"",
    stderr:"",
    submit_time: getDate().toLocaleTimeString(),
    language_id: "1",
    problem_id:1,
    time_elapsed:1,
    user_id:"1"
  },
];

