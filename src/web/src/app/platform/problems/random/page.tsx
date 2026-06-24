import { auth } from "@/app/auth";
import { apiGetProblems, apiGetRecentSubmissions } from "@/lib/api";
import { Problem } from "@/lib/types";
import { redirect } from "next/navigation";

const pickRandomProblem = (problems: Problem[]): Problem | undefined => {
  if (problems.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * problems.length);
  return problems[index];
};

export default async function RandomProblemPage() {
  const session = await auth();

  if (!session?.nextjudge_token || !session.nextjudge_id) {
    redirect("/auth/login");
  }

  const token = session.nextjudge_token;
  const userId = session.nextjudge_id;

  const [problemsResult, submissionsResult] = await Promise.allSettled([
    apiGetProblems(token),
    apiGetRecentSubmissions(token, userId),
  ]);

  const problems =
    problemsResult.status === "fulfilled" ? problemsResult.value : [];
  const submissions =
    submissionsResult.status === "fulfilled" ? submissionsResult.value : [];

  const visibleProblems = problems.filter((problem) => problem.public !== false);

  if (visibleProblems.length === 0) {
    redirect("/platform/problems");
  }

  const solvedProblemIds = new Set(
    submissions
      .filter((submission) => submission.status === "ACCEPTED")
      .map((submission) => submission.problem_id),
  );

  const unsolvedProblems = visibleProblems.filter(
    (problem) => !solvedProblemIds.has(problem.id),
  );

  const selectedProblem = pickRandomProblem(
    unsolvedProblems.length > 0 ? unsolvedProblems : visibleProblems,
  );

  if (!selectedProblem) {
    redirect("/platform/problems");
  }

  redirect(`/platform/problems/${selectedProblem.id}`);
}
