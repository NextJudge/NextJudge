import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { apiGetProblems, apiGetRecentSubmissions } from "@/lib/api";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { auth } from "@/app/auth";
import { Metadata } from "next";
import { RecentSubmissions } from "../components/recent-submissions";

export const metadata: Metadata = {
  title: "NextJudge - Problems",
  description: "Our curated list of problems for you to solve.",
};

export default async function ProblemsPage() {

  const session = await auth()

  if (!session) {
    throw "You must be signed-in to view this page"
  }

  const results = await Promise.allSettled(
    [
      apiGetProblems(session.nextjudge_token),
      apiGetRecentSubmissions(session.nextjudge_token, session.nextjudge_id)
    ]
  )

  const [problemsResult, recentSubmissionsResult] = results

  const problems = problemsResult.status === 'fulfilled' ? problemsResult.value : []
  const recentSubmissions = recentSubmissionsResult.status === 'fulfilled' ? recentSubmissionsResult.value : []
  return (
    <>
      <PlatformNavbar session={session}>
        <UserAvatar session={session} />
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
        <RecentSubmissions submissions={recentSubmissions} />
      </div>
    </>
  );
}
