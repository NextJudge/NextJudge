
import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { apiGetPublicEvents, apiGetRecentSubmissions } from "@/lib/api";
import { NextJudgeEvent, Submission } from "@/lib/types";
import { auth } from "../auth";
import { EnhancedContestGrid } from "./admin/contests/enhanced-contest-card";
import { SubmissionCards } from "./components/submission-cards";
import SubmissionDrawer from "./problems/components/submission-drawer";

export default async function PlatformHome() {
  const session = await auth()

  if (!session) {
    throw "You must be signed-in to view this page"
  }

  let recentContests: NextJudgeEvent[];
  let recentSubmissions: Submission[];

  try {
    const contestsData = await apiGetPublicEvents(session.nextjudge_token);
    recentContests = (contestsData || []).slice(0, 5); // Show only first 5
  } catch (error) {
    console.error('Failed to fetch contests:', error);
    recentContests = [];
  }

  try {
    const submissionsData = await apiGetRecentSubmissions(session.nextjudge_token, session.nextjudge_id);
    recentSubmissions = submissionsData || [];
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    recentSubmissions = [];
  }

  return (
    <>
      <PlatformNavbar session={session}>
        <UserAvatar session={session} />
      </PlatformNavbar>
      <div className="max-w-7xl w-full flex-1 flex-col space-y-8 p-8 mx-8 md:flex">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-8">
            <h1 className="text-2xl font-bold">Recent Contests</h1>
            <a href="/platform/contests" className="text-sm font-light">
              View All
            </a>
          </div>
          <EnhancedContestGrid contests={recentContests} showActions={false} />
        </div>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-8">
            <h1 className="text-2xl font-bold">Recent Submissions</h1>
            <div className="ml-auto flex min-w-0 items-center space-x-4">
              <SubmissionDrawer submissions={recentSubmissions} />
            </div>
          </div>
          <SubmissionCards submissions={recentSubmissions} />
        </div>
      </div>
    </>
  );
}
