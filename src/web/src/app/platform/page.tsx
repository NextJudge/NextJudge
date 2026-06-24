import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import SubmissionGraph from "@/components/submission-graph";
import {
	apiGetProblems,
	apiGetPublicEvents,
	apiGetRecentSubmissions,
	apiGetUserSubmissionCount,
} from "@/lib/api";
import {
	pickContestSpotlight,
	pickRecommendedProblem,
	summarizeVerdicts,
} from "@/lib/dashboard-utils";
import { NextJudgeEvent, Problem, Submission } from "@/lib/types";
import { auth } from "../auth";
import { ContestSpotlight } from "./components/contest-spotlight";
import { DashboardStats } from "./components/dashboard-stats";
import { RecentContests } from "./components/recent-contests";
import { RecentSubmissions } from "./components/recent-submissions";
import { RecommendedProblem } from "./components/recommended-problem";
import { WelcomeSection } from "./components/welcome-section";

export default async function PlatformHome() {
	const session = await auth();

	if (!session) {
		throw "You must be signed-in to view this page";
	}

	const token = session.nextjudge_token;
	const userId = session.nextjudge_id;

	if (!token || !userId) {
		throw "You must be signed-in to view this page";
	}

	const [contestsResult, submissionsResult, problemsResult, countResult] =
		await Promise.allSettled([
			apiGetPublicEvents(token),
			apiGetRecentSubmissions(token, userId),
			apiGetProblems(token),
			apiGetUserSubmissionCount(token, userId),
		]);

	const contests: NextJudgeEvent[] =
		contestsResult.status === "fulfilled" ? contestsResult.value ?? [] : [];
	const recentSubmissions: Submission[] =
		submissionsResult.status === "fulfilled"
			? (submissionsResult.value ?? []).sort(
					(a, b) =>
						new Date(b.submit_time).getTime() -
						new Date(a.submit_time).getTime(),
				)
			: [];
	const problems: Problem[] =
		problemsResult.status === "fulfilled" ? problemsResult.value ?? [] : [];

	let submissionCount = recentSubmissions.length;
	if (countResult.status === "fulfilled") {
		submissionCount = countResult.value;
	}

	const userName = session.user?.name ?? "there";
	const verdicts = summarizeVerdicts(recentSubmissions);
	const spotlightContest = pickContestSpotlight(contests);
	const recommendedProblem = pickRecommendedProblem(problems, recentSubmissions);
	const recentContests = contests.slice(0, 5);

	const mostRecentSubmission = recentSubmissions[0];
	const continueProblemId = mostRecentSubmission?.problem_id;
	const continueProblemTitle = mostRecentSubmission?.problem?.title;

	return (
		<>
			<PlatformNavbar session={session}>
				<UserAvatar session={session} />
			</PlatformNavbar>
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<WelcomeSection name={userName} />

				<DashboardStats
					submissionCount={submissionCount}
					verdicts={verdicts}
					continueProblemId={continueProblemId}
					continueProblemTitle={continueProblemTitle}
				/>

				<section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<ContestSpotlight contest={spotlightContest} />
					<RecommendedProblem problem={recommendedProblem} />
				</section>

				<section className="mb-12">
					<SubmissionGraph submissions={recentSubmissions} />
				</section>

				<RecentContests contests={recentContests} />
				<RecentSubmissions
					submissions={recentSubmissions}
					sectionId="submissions"
					viewAllHref="/platform#submissions"
				/>
			</div>
		</>
	);
}
