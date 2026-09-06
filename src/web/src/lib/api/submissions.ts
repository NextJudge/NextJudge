import { z } from "zod";
import { Submission, SubmissionStatus } from "../types";
import {
	parseSubmission,
	parseSubmissionList,
	parseSubmissionListPage,
	parseSubmissionStatusPoll,
	type SubmissionListPageSchema,
} from "../schemas/submission";
import {
	apiFetch,
	apiFetchParsed,
	apiUrl,
	authHeaders,
	jsonAuthHeaders,
	parseApiError,
} from "./client";

export type SubmissionStatusPoll = {
	id: string;
	status: SubmissionStatus;
};

export type SubmissionListParams = {
	cursor?: string;
	limit?: number;
	status?: SubmissionStatus;
	problem_id?: number;
	language_id?: string;
};

const postSubmissionResponseSchema = z.object({
	id: z.string(),
});

export type PostSubmissionResponse = z.infer<typeof postSubmissionResponseSchema>;

const buildSubmissionListQuery = (params: SubmissionListParams = {}): string => {
	const search = new URLSearchParams();
	if (params.cursor) {
		search.set("cursor", params.cursor);
	}
	if (params.limit !== undefined) {
		search.set("limit", String(params.limit));
	}
	if (params.status) {
		search.set("status", params.status);
	}
	if (params.problem_id !== undefined) {
		search.set("problem_id", String(params.problem_id));
	}
	if (params.language_id) {
		search.set("language_id", params.language_id);
	}
	const query = search.toString();
	return query ? `?${query}` : "";
};

export async function apiListSubmissions(
	token: string,
	params: SubmissionListParams = {},
): Promise<SubmissionListPageSchema> {
	return apiFetchParsed(
		`/v1/submissions${buildSubmissionListQuery(params)}`,
		parseSubmissionListPage,
		{ headers: authHeaders(token) },
	);
}

export async function apiGetSubmission(
	token: string,
	id: string,
): Promise<Submission> {
	return apiFetchParsed(
		`/v1/submissions/${id}`,
		parseSubmission,
		{ headers: authHeaders(token) },
	);
}

/** @deprecated use apiGetSubmission */
export async function apiGetSubmissionsStatus(
	token: string,
	id: string,
): Promise<Submission> {
	return apiGetSubmission(token, id);
}

/** Fetches a graded submission including per-test-case run results. */
export async function apiGetSubmissionRuns(
	token: string,
	id: string,
): Promise<Submission> {
	return apiGetSubmission(token, id);
}

export async function postSolution(
	token: string,
	code: string,
	language_id: string,
	problem_id: number,
	user_id: string,
	event_id?: number,
): Promise<PostSubmissionResponse> {
	const requestBody: Record<string, string | number> = {
		source_code: code,
		language_id,
		problem_id,
	};

	if (event_id !== undefined && event_id !== 0) {
		requestBody.event_id = event_id;
	}

	const response = await fetch(apiUrl("/v1/submissions"), {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		await parseApiError(response);
	}

	const json: unknown = await response.json();
	return postSubmissionResponseSchema.parse(json);
}

export async function apiGetSubmissionStatusPoll(
	token: string,
	id: string,
): Promise<SubmissionStatusPoll> {
	return apiFetchParsed(
		`/v1/submissions/${id}/status`,
		parseSubmissionStatusPoll,
		{ headers: jsonAuthHeaders(token) },
	);
}

export async function apiWaitForSubmissionResult(
	token: string,
	id: string,
	intervalMs = 1000,
): Promise<Submission> {
	let poll = await apiGetSubmissionStatusPoll(token, id);
	while (poll.status === "PENDING") {
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
		poll = await apiGetSubmissionStatusPoll(token, id);
	}

	return apiGetSubmission(token, id);
}

export async function apiGetRecentSubmissions(
	token: string,
	user_id: string,
): Promise<Submission[]> {
	return apiFetchParsed(
		`/v1/user_submissions/${user_id}`,
		parseSubmissionList,
		{ headers: authHeaders(token) },
	);
}

export async function apiGetRecentSubmissionsForProblem(
	token: string,
	problem_id: number,
	user_id: string,
): Promise<Submission[]> {
	return apiFetchParsed(
		`/v1/user_problem_submissions/${user_id}/${problem_id}`,
		parseSubmissionList,
		{ headers: authHeaders(token) },
	);
}
