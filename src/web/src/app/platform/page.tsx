import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { apiGetPublicEvents, apiGetRecentSubmissions } from "@/lib/api";
import { NextJudgeEvent, Submission } from "@/lib/types";
import { auth } from "../auth";
import { RecentSubmissions } from "./components/recent-submissions";
import { RecentContests } from "./components/recent-contests";

export default async function PlatformHome() {
  const session = await auth()

  if (!session) {
    throw "You must be signed-in to view this page"
  }

  let recentContests: NextJudgeEvent[];
  let recentSubmissions: Submission[];

  try {
    const contestsData = await apiGetPublicEvents(session.nextjudge_token);
    recentContests = (contestsData || []).slice(0, 5);
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
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <RecentContests contests={recentContests} />
        <RecentSubmissions submissions={recentSubmissions} />
      </main>
    </>
  );
}
