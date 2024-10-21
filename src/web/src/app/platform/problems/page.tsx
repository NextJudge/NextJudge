import PlatformNavbar from "@/components/nav/platform-nav";
import UserAvatar from "@/components/nav/user-avatar";
import { Metadata } from "next";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { RecentSubmissionCard } from "./components/recent-submissions";
import { apiGetProblems, apiGetRecentSubmissions } from "@/lib/api";

export const metadata: Metadata = {
  title: "NextJudge - Problems",
  description: "Our curated list of problems for you to solve.",
};

export default async function ProblemsPage() {
  // TODO: fix this - this should run adhoc
  const problems = await apiGetProblems();
  const recentSubmissions = await apiGetRecentSubmissions("25c054a1-e306-4851-b229-67acffa65e56");
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
