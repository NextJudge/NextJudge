"use client";
import { ContestCard } from "@/app/platform/admin/contests/contest-card";
import { RecentSubmissionCard } from "@/app/platform/problems/components/recent-submissions";
import { serverRenderRecents } from "@/app/platform/problems/data/data";
import { cn } from "@/lib/utils";
import { Editor } from "@monaco-editor/react";
import {
  IconBoxAlignTopLeft,
  IconClipboardCopy,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { Card } from "../ui/card";

export function WhyNextJudge() {
  return (
    <section id="features" className="py-12">
      <h1 className="text-lg md:text-4xl font-medium font-sans text-center max-w-2xl mx-auto">
        NextJudge offers all the tools you need to
        <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
          {" "}
          host, participate in, and organize{" "}
        </span>
        programming contests.
      </h1>

      <div className=" my-12 flex flex-col items-center justify-center w-full h-full p-3">
        <BentoGrid className="max-w-6xl mx-auto">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={i === 0 || i === 3 ? "md:col-span-2" : "cols-span-3"}
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

const mergeSort = `function merge(left: number[], right: number[]): number[] {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] < right[rightIndex]) {
        result.push(left[leftIndex]);
        leftIndex++;
        } else {
        result.push(right[rightIndex]);
        rightIndex++;
        }
    }
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function main() {
  const input = [3, 5, 1, 4, 2];
  const sorted = mergeSort(input);
  console.log(sorted);
}`;

export const DummyCodeEditor = () => {
  const { resolvedTheme } = useTheme();
  return (
    <Card className={cn("flex flex-col items-center p-2")}>
      <Editor
        height="450px"
        className="h-full w-full rounded pointer-events-none select-none shadow-none"
        defaultLanguage="typescript"
        defaultValue={mergeSort}
        options={{
          lineNumbers: "off",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
      />
    </Card>
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

const mockProblems = [
  { title: "Problem 1" },
  { title: "Problem 2" },
  { title: "Problem 3" },
];

const mockComps = [
  {
    startTime: "2022-10-01T00:00:00Z",
    endTime: "2022-10-01T23:59:59Z",
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
];

const ContestCardPreview = () => {
  return (
    <Card className={cn("flex flex-col items-center border-none")}>
      <ContestCard contest={mockComps[0]} />
    </Card>
  );
};

const ThreeSubmissionsCard = () => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {serverRenderRecents.map((submission) => (
        <RecentSubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
};

export const items = [
  {
    title: "Code Editor",
    description:
      "Built on top of Monaco Editor, NextJudge provides a powerful code editor with syntax highlighting, code completion, for all of our supported programming languages on the platform.",
    header: <DummyCodeEditor />,
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Track Your Submissions",
    description:
      "View your recent submissions and track your progress with our submission history.",
    header: <ThreeSubmissionsCard />,
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
