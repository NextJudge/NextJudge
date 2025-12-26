"use client";
import { ContestCard } from "@/components/contest-card";
import { RecentSubmissionCard } from "@/app/platform/problems/components/recent-submissions";
import { Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  IconBoxAlignTopLeft,
  IconClipboardCopy,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { Card } from "../ui/card";

export function WhyNextJudge() {
  return (
    <section id="features" className="py-20">
      <h1 className="text-2xl md:text-4xl font-medium font-sans text-center w-full mx-auto max-w-3xl px-6">
        NextJudge offers all the tools you need to{" "}
        <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
          {" "}
          host, participate in, and organize{" "}
        </span>
        programming contests.
      </h1>

      <div className=" my-12 flex flex-col items-center justify-center w-full h-full p-3">
        <BentoGrid className="max-w-6xl mx-auto">
          {items(5).map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={i === 0 || i === 3 ? "md:col-span-2" : "col-span-1"}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);

const mergeSort = `const fs = require('fs');

function merge(left, right) {
    const result = [], leftIndex = 0, rightIndex = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] < right[rightIndex]) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }
    while (leftIndex < left.length) {
        result.push(left[leftIndex]);
        leftIndex++;
    }
    while (rightIndex < right.length) {
        result.push(right[rightIndex]);
        rightIndex++;
    }
    return result;
}

const mergeSort = (arr) => arr.length <= 1 ? arr :
      merge(mergeSort(arr.slice(0, arr.length / 2)), mergeSort(arr.slice(arr.length / 2)));

function main() {
    const input = fs.readFileSync(0, 'utf8').trim()
            .split('\\n').map(line => line.split(' ').map(Number));
    input.forEach(arr => {
        const sorted = mergeSort(arr);
        console.log(sorted.join(' '));
    });
}

main();`;

const selectionSort = `function selectionSort(arr: number[]): number[] {
    for (let i = 0; i < arr.length; i++) {
        let min = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[min]) {
                min = j;
            }
        }
        if (min !== i) {
            [arr[i], arr[min]] = [arr[min], arr[i]];
        }
    }
    return arr;
}

function main() {
    const input = [3, 5, 1, 4, 2];
    const sorted = selectionSort(input);
    console.log(sorted);
}`;

interface DummyCodeEditorProps {
  mock?: boolean;
  sourceCode?: string;
  language?: string;
  readOnly?: boolean;
}

export const DummyCodeEditor = ({
  mock,
  sourceCode,
  language,
  readOnly = false,
}: DummyCodeEditorProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <div className="w-full h-full min-h-[450px] flex flex-col">
      <Editor
        language={language || "javascript"}
        className={cn(
          { "pointer-events-none select-none": mock },
          "w-full h-full border-0"
        )}
        height={"100%"}
        defaultLanguage={language}
        defaultValue={mock ? mergeSort : sourceCode || mergeSort}
        options={{
          theme: resolvedTheme === "dark" ? "vs-dark" : "vs-light",
          lineNumbers: "off",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: readOnly,
        }}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
      />
    </div>
  );
};

const ContestImage = () => {
  return (
    <>
      <Card className={cn("flex flex-col items-center p-1")}>
        <Image
          src={"/contest.png"}
          alt="contest"
          width={500}
          height={300}
          className="w-max"
        />
      </Card>
    </>
  );
};

const BunLogo = () => {
  return (
    <>
      <Card className={cn("flex flex-col items-center")}>
        <Image
          src="/icons/bun.svg"
          alt="bun"
          width={32}
          height={32}
          className="w-[9.5rem] scale-75"
        />
        <h3 className="font-semibold mb-2">Powered By Bun</h3>
      </Card>
    </>
  );
};

const ProblemPreview = () => {
  return (
    <>
      <Card className={cn("flex flex-col items-center p-1")}>
        <Image
          src={"/problem.png"}
          alt="problem"
          width={500}
          height={300}
          className="w-max"
        />
      </Card>
    </>
  );
};

const ThemeSelector = () => {
  return (
    <>
      <Card className={cn("flex flex-col items-center border-none")}>
        <Image
          src="/selector.png"
          alt="selector"
          width={500}
          height={300}
          className="w-full h-full rounded"
        />
      </Card>
    </>
  );
};

const mockUsers = [
  {
    id: "user1",
    account_identifier: "alice_codes",
    name: "Alice Johnson",
    email: "alice@university.edu",
    emailVerified: "2024-01-01T00:00:00Z",
    image: "/avatars/alice.jpg",
    join_date: "2024-01-01T00:00:00Z",
    is_admin: false,
  },
  {
    id: "user2",
    account_identifier: "bob_dev",
    name: "Bob Chen",
    email: "bob@university.edu",
    emailVerified: "2024-01-02T00:00:00Z",
    image: "/avatars/bob.jpg",
    join_date: "2024-01-02T00:00:00Z",
    is_admin: false,
  },
  {
    id: "user3",
    account_identifier: "charlie_algo",
    name: "Charlie Williams",
    email: "charlie@university.edu",
    emailVerified: "2024-01-03T00:00:00Z",
    image: "/avatars/charlie.jpg",
    join_date: "2024-01-03T00:00:00Z",
    is_admin: false,
  },
  {
    id: "user4",
    account_identifier: "diana_prog",
    name: "Diana Rodriguez",
    email: "diana@university.edu",
    emailVerified: "2024-01-04T00:00:00Z",
    image: "/avatars/diana.jpg",
    join_date: "2024-01-04T00:00:00Z",
    is_admin: false,
  },
  {
    id: "user5",
    account_identifier: "evan_cp",
    name: "Evan Thompson",
    email: "evan@university.edu",
    emailVerified: "2024-01-05T00:00:00Z",
    image: "/avatars/evan.jpg",
    join_date: "2024-01-05T00:00:00Z",
    is_admin: false,
  },
].flatMap((user) => Array(11).fill(user));

const mockProblems = [
  {
    id: 1,
    title: "Two Sum",
    prompt: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    timeout: 1000,
    difficulty: "EASY" as const,
    user_id: "admin",
    upload_date: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    test_cases: [],
    categories: [],
    public: true,
    identifier: "two-sum",
    source: "LeetCode",
    accept_timeout: 1.0,
    execution_timeout: 2.0,
    memory_limit: 256,
  },
  {
    id: 2,
    title: "Binary Search",
    prompt: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.",
    timeout: 1000,
    difficulty: "EASY" as const,
    user_id: "admin",
    upload_date: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    test_cases: [],
    categories: [],
    public: true,
    identifier: "binary-search",
    source: "LeetCode",
    accept_timeout: 1.0,
    execution_timeout: 2.0,
    memory_limit: 256,
  },
  {
    id: 3,
    title: "Merge Sort",
    prompt: "Implement the merge sort algorithm to sort an array of integers in ascending order.",
    timeout: 2000,
    difficulty: "MEDIUM" as const,
    user_id: "admin",
    upload_date: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
    test_cases: [],
    categories: [],
    public: true,
    identifier: "merge-sort",
    source: "Classic Algorithm",
    accept_timeout: 2.0,
    execution_timeout: 3.0,
    memory_limit: 512,
  },
  {
    id: 4,
    title: "Longest Palindromic Substring",
    prompt: "Given a string s, return the longest palindromic substring in s.",
    timeout: 3000,
    difficulty: "MEDIUM" as const,
    user_id: "admin",
    upload_date: "2024-01-04T00:00:00Z",
    updated_at: "2024-01-04T00:00:00Z",
    test_cases: [],
    categories: [],
    public: true,
    identifier: "longest-palindrome",
    source: "LeetCode",
    accept_timeout: 2.0,
    execution_timeout: 4.0,
    memory_limit: 512,
  },
  {
    id: 5,
    title: "N-Queens",
    prompt: "The n-queens puzzle is the problem of placing n queens on an n×n chessboard such that no two queens attack each other.",
    timeout: 5000,
    difficulty: "HARD" as const,
    user_id: "admin",
    upload_date: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-05T00:00:00Z",
    test_cases: [],
    categories: [],
    public: true,
    identifier: "n-queens",
    source: "Classic Problem",
    accept_timeout: 3.0,
    execution_timeout: 5.0,
    memory_limit: 1024,
  },
].flatMap((problem) => Array(2).fill(problem));

const mockContest = {
  id: 1,
  user_id: "admin",
  title: "6th Annual ACM@OSU Programming Contest",
  description: "The annual programming contest held by the Student ACM Chapter at Oregon State University. Join us for an exciting day of algorithmic problem solving! Location: Kelley Engineering Center Room 1003.",
  start_time: "2024-10-15T09:00:00Z",
  end_time: "2024-10-15T17:00:00Z",
  teams: false,
  problems: mockProblems,
  participants: mockUsers,
  participant_count: mockUsers.length,
  problem_count: mockProblems.length,
};

const ContestCardPreview = () => {
  return (
    <Card className={cn("flex flex-col items-center border-none")}>
      <ContestCard contest={mockContest} showActions={false} />
    </Card>
  );
};

export const mockSubmissions: any[] = [
  {
    id: "1",
    problem: { title: "First Bad Version" },
    language: { name: "TypeScript" },
    submit_time: new Date().toLocaleString(),
    status: "ACCEPTED",
  },
  {
    id: "2",
    problem: { title: "Cherry Pickup II" },
    language: { name: "Rust" },
    submit_time: new Date().toLocaleString(),
    status: "WRONG_ANSWER",
  },
  {
    id: "3",
    problem: { title: "Xen Tree" } as any,
    language: { name: "Swift" } as any,
    submit_time: new Date().toLocaleString(),
    status: "ACCEPTED",
  },
  {
    id: "4",
    problem: {
      title: "Intersection of Two Arrays",
    },
    language: { name: "Go" },
    submit_time: new Date().toLocaleString(),
    status: "RUNTIME_ERROR",
  },
  {
    id: "5",
    problem: {
      title: "Count Sorted Vowel Strings",
    },
    language: { name: "Python" },
    submit_time: new Date().toLocaleString(),
    status: "PENDING",
  },
];

const ThreeSubmissionsCard = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {mockSubmissions.slice(0, count).map((submission: Submission) => (
        <RecentSubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
};

export const items = (count?: number): { title: string; description: string; header: React.ReactNode; icon: React.ReactNode }[] => [
  {
    title: "Code Editor",
    description:
      "Built on top of Monaco Editor, NextJudge provides a powerful code editor with syntax highlighting, code completion, for all of our supported programming languages on the platform.",
    header: <DummyCodeEditor mock language="javascript" />,
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Track Your Submissions",
    description:
      "View your recent submissions and track your progress with our submission history.",
    header: <ThreeSubmissionsCard count={count} />,
    icon: <IconBoxAlignTopLeft className="h-4 w-4 text-neutral-500" />,
  },
  //   {
  //     title: "Customizable",
  //     description:
  //       "Want to change the code editor theme? Maybe, use vim key bindings? No problem!",
  //     header: <ThemeSelector />,
  //     icon: <IconBoxAlignTopLeft className="h-4 w-4 text-neutral-500" />,
  //   },
  {
    title: "Bleeding Edge Tech",
    description:
      "Built with developers in mind, NextJudge is powered by Bun, a modern JavaScript runtime for building applications.",
    header: <BunLogo />,
    icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Competitions for Any Use-Case",
    description:
      "Have a community contest, a classroom assignment, or a private contest with friends easily. NextJudge has you covered with our contest infrastructure for any use-case, with support for ICPC-style contests, virtual contests, and more.",
    header: <ContestCardPreview />,
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  //   {
  //     title: "Contest Infrastructure",
  //     description:
  //       "NextJudge comes with a powerful contest infrastructure that allows you to create and manage contests with ease.",
  //     header: <ContestImage />,
  //     icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  //   },
  //   {
  //     title: "Your Problems, Your Way",
  //     description:
  //       "Administrators on NextJudge can publish new problems written in Latex.",
  //     header: <ProblemPreview />,
  //     icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  //   },
];
