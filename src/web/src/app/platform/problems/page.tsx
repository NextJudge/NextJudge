import { promises as fs } from "fs";
import { Metadata } from "next";
import path from "path";
import { z } from "zod";

import { fetchProblems } from "@/app/actions";
import PlatformNavbar from "@/components/nav/platform-nav";
import UserAvatar from "@/components/nav/user-avatar";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { RecentSubmissionCard } from "./components/recent-submissions";
import { recentSubmissions } from "./data/data";
import { Problem, RecentSubmission, problemSchema } from "./data/schema";

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
  const problems = await fetchProblems();
  return problems as Problem[];
}

async function getRecentSubmissions(): Promise<RecentSubmission[]> {
  const promise = new Promise<RecentSubmission[]>((resolve) => {
    setTimeout(() => {
      resolve(recentSubmissions);
    }, 1000);
  });
  return promise;
}

export default async function ProblemsPage() {
  //   const problems = await getProblems();
  const problems = await getProblems2();
  //   console.log(problems2);
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

        <div className="flex items-center justify-between space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSubmissions.map((submission) => (
              <RecentSubmissionCard
                key={submission.id}
                submission={submission}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
