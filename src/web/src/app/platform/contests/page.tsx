import PlatformNavbar from "@/components/nav/platform-nav";
import UserAvatar from "@/components/nav/user-avatar";
import SubmissionGraph from "@/components/submission-graph";
import { Metadata } from "next";
import { ContestCard } from "../admin/contests/contest-card";
import { auth } from "@/app/auth";
import { apiGetEvents } from "@/lib/api";


export default async function ProblemsPage() {

  const session = await auth()

  if(!session) {
    throw "You must be signed-in to view this page"
  }

  const upcomingContests = await apiGetEvents(session.nextjudge_token);
  
  return (
    <>
      <PlatformNavbar>
        <UserAvatar />
      </PlatformNavbar>
      <div className="max-w-7xl w-full flex-1 flex-col space-y-4 p-8 mx-8 md:flex">
        <div className="flex items-center justify-between space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Contests</h2>
            <p className="text-muted-foreground">
              Check out the upcoming contests.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {upcomingContests?.map((contest: any, index: number) => (
            <ContestCard key={index} contest={contest} />
          ))}
        </div>

        <div className="flex items-center justify-center py-4" id="submissions">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-center tracking-tight">
              Contest statistics
            </h2>
            <p className="text-muted-foreground">
              Your contest data, all in one place.
            </p>
          </div>
        </div>
        <SubmissionGraph />
      </div>
    </>
  );
}
