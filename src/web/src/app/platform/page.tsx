import { ContestCard } from "./admin/contests/contest-card";
import { RecentSubmissionCard } from "./problems/components/recent-submissions";
import { recentSubmissions } from "./problems/data/data";

export default async function PlatformHome() {
  const recentContests = [
    {
      id: 1,
      userId: 1,
      description:
        "The 10th annual ACM at OSU programming competition. Meant for all skill levels.",
      title: "Codeforces Round #745 (Div. 2)",
      startTime: new Date(),
      endTime: new Date(),
      participants: [1, 2, 3, 4, 5],
      problems: [1, 2, 3, 4, 5],
    },
    {
      id: 2,
      userId: 2,
      description:
        "The 10th annual ACM at OSU programming competition. Meant for all skill levels.",
      title: "Codeforces Round #744 (Div. 3)",
      startTime: new Date(),
      endTime: new Date(),
      participants: [1, 2, 3, 4, 5],
      problems: [1, 2, 3, 4, 5],
    },
    {
      id: 3,
      userId: 3,
      description:
        "The 10th annual ACM at OSU programming competition. Meant for all skill levels.",
      title: "Codeforces Round #743 (Div. 2)",
      startTime: new Date(),
      endTime: new Date(),
      participants: [1, 2, 3, 4, 5],
      problems: [1, 2, 3, 4, 5],
    },
    {
      id: 4,
      userId: 4,
      description:
        "The 10th annual ACM at OSU programming competition. Meant for all skill levels.",
      title: "Codeforces Round #742 (Div. 2)",
      startTime: new Date(),
      endTime: new Date(),
      participants: [1, 2, 3, 4, 5],
      problems: [1, 2, 3, 4, 5],
    },
    {
      id: 5,
      userId: 5,
      description:
        "The 10th annual ACM at OSU programming competition. Meant for all skill levels.",
      title: "Codeforces Round #741 (Div. 2)",
      startTime: new Date(),
      endTime: new Date(),
      participants: [1, 2, 3, 4, 5],
      problems: [1, 2, 3, 4, 5],
    },
  ];

  const deleteContest = async (id: number) => {
    "use server";
    console.log("Deleting contest with id: ", id);
  };
  return (
    <div className="max-w-7xl w-full flex-1 flex-col space-y-8 p-8 mx-8 md:flex">
      {/* Contests */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-8">
          <h1 className="text-2xl font-bold">Recent Contests</h1>
          <a href="/platform/contests" className="text-sm font-light">
            View All
          </a>
        </div>

        {/* Contest Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recentContests.map((contest, idx) => (
            <ContestCard key={idx} contest={contest} />
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-8">
          <h1 className="text-2xl font-bold">Recent Submissions</h1>
          <a href="/platform/contests" className="text-sm font-light">
            View All
          </a>
        </div>

        {/* Submission Cards */}
        <div className="grid grid-cols-1 gap-4">
          {recentSubmissions.map((submission) => (
            <RecentSubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      </div>
    </div>
  );
}
