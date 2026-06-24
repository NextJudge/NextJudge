import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { apiGetProblems, apiGetRecentSubmissions } from "@/lib/api";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { auth } from "@/app/auth";
import { PAGE_DESCRIPTIONS, PAGE_TITLES } from "@/lib/site";
import { Metadata } from "next";
import { RecentSubmissions } from "../components/recent-submissions";

export const metadata: Metadata = {
  title: PAGE_TITLES.problems,
  description: PAGE_DESCRIPTIONS.problems,
};

export default async function ProblemsPage() {

  const session = await auth()

  if (!session?.nextjudge_token || !session.nextjudge_id) {
    throw "You must be signed-in to view this page"
  }

  const token = session.nextjudge_token;
  const userId = session.nextjudge_id;

  const results = await Promise.allSettled(
    [
      apiGetProblems(token),
      apiGetRecentSubmissions(token, userId)
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
        <header className="flex items-center justify-between space-y-4">
          <div className="space-y-2">
            <h1
              id="problems-heading"
              className="text-2xl font-bold tracking-tight"
            >
              All Problems
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s the full list of problems on the platform.
            </p>
          </div>
        </header>
        <section aria-labelledby="problems-heading">
          <DataTable data={problems} columns={columns} />
        </section>
        <RecentSubmissions submissions={recentSubmissions} sectionId="submissions" />
      </div>
    </>
  );
}
