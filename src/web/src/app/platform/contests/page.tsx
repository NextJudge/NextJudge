import PlatformNavbar from "@/components/nav/platform-nav";
import SubmissionGraph from "@/components/submission-graph";
import { Metadata } from "next";
import { ContestCard } from "../admin/contests/contest-card";

export const metadata: Metadata = {
  title: "NextJudge - Problems",
  description: "Our curated list of problems for you to solve.",
};

const mockProblems = [
  { title: "Problem 1" },
  { title: "Problem 2" },
  { title: "Problem 3" },
];

const mockComps = [
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
];

async function getThreeMostRecentContests(): Promise<any> {
  const promise = new Promise((resolve, reject) => {
    const contests = mockComps.slice(0, 3);
    resolve(contests);
  });
  return promise;
}

export default async function ProblemsPage() {
  const upcomingContests = await getThreeMostRecentContests();
  return (
    <>
      <PlatformNavbar />
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
