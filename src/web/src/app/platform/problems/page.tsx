import { auth } from "@/app/auth";
import PlatformNavbar from "@/components/nav/platform-nav";
import UserAvatar from "@/components/nav/user-avatar";
import prisma from "@db/prismaClient";
import { promises as fs } from "fs";
import { Metadata } from "next";
import path from "path";
import { z } from "zod";
import { SingleSubmission } from "./(problem)/[id]/page";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { RecentSubmissionCard } from "./components/recent-submissions";
import { problemSchema } from "./data/schema";

export const metadata: Metadata = {
  title: "NextJudge - Problems",
  description: "Our curated list of problems for you to solve.",
};

async function getProblems() {
  const data = await fs.readFile(
    path.join(process.cwd(), "src/app/platform/problems/data/problems.json")
  );
  const mProblems = JSON.parse(data.toString());
  return z.array(problemSchema).parse(mProblems);
}

async function getProblems2() {
  const problems = await prisma.problems.findMany({
    select: {
      id: true,
      title: true,
      difficulty: true,
      problem_categories: {
        select: {
          categories: {
            select: {
              name: true,
            },
          },
        },
      },
      upload_date: true,
      submissions: {
        select: {
          id: true,
          source_code: true,
        },
      },
      users: {
        select: {
          name: true,
        },
      },
    },
  });
  return problems;
}

async function getRecentSubmissions(): Promise<SingleSubmission[]> {
  const authObj = await auth();
  const userId = parseInt(authObj?.user?.id as string);
  if (!userId || isNaN(userId)) {
    return [];
  }
  const submissions = await prisma.submissions.findMany({
    where: {
      user_id: userId,
    },
    take: 8,
    orderBy: {
      id: "desc",
    },
    include: {
      problems: {
        select: {
          title: true,
          users: {
            select: {
              name: true,
            },
          },
          submissions: {
            select: {
              source_code: true,
            },
          },
        },
      },
      languages: {
        select: {
          name: true,
        },
      },
    },
  });

  return submissions;
}

export default async function ProblemsPage() {
  const problems = await getProblems2();
  const recentSubmissions = await getRecentSubmissions();
  return (
    <>
      <PlatformNavbar>
        <UserAvatar />
      </PlatformNavbar>
      <div className="max-w-7xl w-full flex-1 flex-col space-y-4 p-8 mx-8 md:flex">
        <div className="flex items-center justify-between space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">All Problems</h2>
            <p className="text-muted-foreground">
              Here&apos;s the full list of problems on the platform.
            </p>
          </div>
        </div>
        <DataTable data={problems} columns={columns} />
        <div className="flex items-center pt-4" id="submissions">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Recent Submissions
            </h2>
            <p className="text-muted-foreground">
              Tried submitting a solution to one of our problems? Here&apos;s
              your latest submissions.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {recentSubmissions.map((submission) => (
            <RecentSubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      </div>
    </>
  );
}
