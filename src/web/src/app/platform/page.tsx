import { cn } from "@/lib/utils";
import { ContestCard } from "./admin/contests/contest-card";

export default async function PlatformHome() {
  const recentSubmissions = [
    {
      id: 1,
      status: "FAILED",
      language: "C++",
      problem: "A. Way Too Long Words",
    },
    {
      id: 2,
      status: "PENDING",
      language: "Python",
      problem: "B. Watermelon",
    },
    {
      id: 3,
      status: "ACCEPTED",
      language: "C++",
      problem: "C. Two Arrays",
    },
    {
      id: 4,
      status: "ACCEPTED",
      language: "C++",
      problem: "D. Omkar and Bed Wars",
    },
    {
      id: 5,
      status: "PENDING",
      language: "Python",
      problem: "E. Omkar and Password",
    },
  ];

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
    <div className="flex flex-1 flex-col lg:flex-row md:space-x-20 lg:space-y-0 px-12 justify-center items-start">
      {/* Contests */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-8">
          <h1 className="text-2xl font-bold">Recent Contests</h1>
          <a href="/platform/contests" className="text-sm font-light">
            View All
          </a>
        </div>

        {/* Contest Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-6">
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
        <div className="space-y-3 min-w-64">
          {recentSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="hover:bg-neutral-900 transition-colors duration-100 ease-in-out rounded-md cursor-pointer"
            >
              <div className="flex items-center gap-4 p-4 border-[0.5px] rounded-md">
                <div className="flex-1 space-y-4 min-w-64">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium leading-none">
                      {submission.problem}
                    </p>
                    <p
                      className={cn(
                        submission.status === "ACCEPTED" && "text-green-600",
                        submission.status === "PENDING" && "text-yellow-600",
                        submission.status === "FAILED" && "text-red-600",
                        "text-sm font-light brightness-75 leading-none justify-self-end"
                      )}
                    >
                      {submission.status}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {submission.language}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
