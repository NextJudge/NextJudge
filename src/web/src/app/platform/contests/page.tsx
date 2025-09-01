import { auth } from "@/app/auth";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { apiGetPublicEvents } from "@/lib/api";
import { NextJudgeEvent } from "@/lib/types";
import { ContestLandingPage } from "./contest-landing-page";

export default async function ContestsPage() {
  const session = await auth()

  if (!session) {
    throw "You must be signed-in to view this page"
  }

  let upcomingContests: NextJudgeEvent[] = [];
  let ongoingContests: NextJudgeEvent[] = [];
  let pastContests: NextJudgeEvent[] = [];

  try {
    const allEvents = await apiGetPublicEvents(session.nextjudge_token);
    const now = new Date();

    upcomingContests = allEvents.filter(event => new Date(event.start_time) > now);
    ongoingContests = allEvents.filter(event =>
      new Date(event.start_time) <= now && new Date(event.end_time) >= now
    );
    pastContests = allEvents.filter(event => new Date(event.end_time) < now);
  } catch (error) {
    console.error('Could not fetch events:', error);
    upcomingContests = [];
    ongoingContests = [];
    pastContests = [];
  }

  return (
    <>
      <PlatformNavbar session={session}>
        <UserAvatar session={session} />
      </PlatformNavbar>
      <ContestLandingPage
        upcomingContests={upcomingContests}
        ongoingContests={ongoingContests}
        pastContests={pastContests}
      />
    </>
  );
}
