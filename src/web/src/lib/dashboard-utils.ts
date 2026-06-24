import type { HeatMapValue } from "@uiw/react-heat-map";
import { isAfter, isBefore } from "date-fns";
import { NextJudgeEvent, Problem, Submission } from "./types";

export interface VerdictSummary {
	accepted: number;
	wrongAnswer: number;
	timeLimitExceeded: number;
}

export function summarizeVerdicts(submissions: Submission[]): VerdictSummary {
	const summary: VerdictSummary = {
		accepted: 0,
		wrongAnswer: 0,
		timeLimitExceeded: 0,
	};

	for (const submission of submissions) {
		switch (submission.status) {
			case "ACCEPTED":
				summary.accepted += 1;
				break;
			case "WRONG_ANSWER":
				summary.wrongAnswer += 1;
				break;
			case "TIME_LIMIT_EXCEEDED":
				summary.timeLimitExceeded += 1;
				break;
			default:
				break;
		}
	}

	return summary;
}

export function pickContestSpotlight(
	contests: NextJudgeEvent[],
): NextJudgeEvent | null {
	const now = new Date();
	const safeContests = Array.isArray(contests) ? contests : [];

	const ongoing = safeContests.find((contest) => {
		const startTime = new Date(contest.start_time);
		const endTime = new Date(contest.end_time);
		return !isBefore(now, startTime) && !isAfter(now, endTime);
	});

	if (ongoing) {
		return ongoing;
	}

	const upcoming = safeContests
		.filter((contest) => isBefore(now, new Date(contest.start_time)))
		.sort(
			(a, b) =>
				new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
		);

	return upcoming[0] ?? null;
}

export function pickRecommendedProblem(
	problems: Problem[],
	submissions: Submission[],
): Problem | null {
	const safeProblems = Array.isArray(problems) ? problems : [];
	const visibleProblems = safeProblems.filter(
		(problem) => problem.public !== false,
	);
	const pool = visibleProblems.length > 0 ? visibleProblems : safeProblems;

	if (pool.length === 0) {
		return null;
	}

	const solvedProblemIds = new Set(
		submissions
			.filter((submission) => submission.status === "ACCEPTED")
			.map((submission) => submission.problem_id),
	);

	const unsolved = pool.find((problem) => !solvedProblemIds.has(problem.id));
	if (unsolved) {
		return unsolved;
	}

	const easyProblem = pool.find(
		(problem) =>
			problem.difficulty === "EASY" || problem.difficulty === "VERY EASY",
	);
	if (easyProblem) {
		return easyProblem;
	}

	return pool[0];
}

export function submissionsToHeatMapValues(
	submissions: Submission[],
): HeatMapValue[] {
	const countByDate = new Map<string, number>();

	for (const submission of submissions) {
		const dateKey = new Date(submission.submit_time).toDateString();
		countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1);
	}

	return Array.from(countByDate.entries()).map(([date, count]) => ({
		date,
		count,
		content: `${count} submission${count === 1 ? "" : "s"}`,
	}));
}

export function getHeatMapDateRange(submissions: Submission[]): {
	startDate: Date;
	endDate: Date;
} {
	const now = new Date();
	const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	if (submissions.length === 0) {
		const startDate = new Date(endDate);
		startDate.setFullYear(startDate.getFullYear() - 1);
		return { startDate, endDate };
	}

	const timestamps = submissions.map((submission) =>
		new Date(submission.submit_time).getTime(),
	);
	const earliest = Math.min(...timestamps);
	const startDate = new Date(earliest);
	startDate.setDate(startDate.getDate() - 7);

	if (startDate > endDate) {
		return {
			startDate: new Date(endDate.getFullYear(), 0, 1),
			endDate,
		};
	}

	return { startDate, endDate };
}
