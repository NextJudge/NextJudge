import { z } from "zod";
import { Submission, SubmissionStatus } from "../types";
import {
	apiFetch,
	apiFetchJson,
	apiUrl,
	authHeaders,
	jsonAuthHeaders,
	parseApiError,
} from "./client";

export type SubmissionStatusPoll = {
	id: string;
	status: SubmissionStatus;
};

const postSubmissionResponseSchema = z.object({
	id: z.string(),
});

export type PostSubmissionResponse = z.infer<typeof postSubmissionResponseSchema>;

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
	return apiFetchJson(`/v1/submissions/${id}/status`, {
		headers: jsonAuthHeaders(token),
	});
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

	return apiGetSubmissionsStatus(token, id);
}

export async function apiGetSubmissionsStatus(
	token: string,
	id: string,
): Promise<Submission> {
	return apiFetchJson(`/v1/submissions/${id}`, {
		headers: jsonAuthHeaders(token),
	});
}

export async function apiGetRecentSubmissions(
	token: string,
	user_id: string,
): Promise<Submission[]> {
	return apiFetchJson(`/v1/user_submissions/${user_id}`, {
		headers: authHeaders(token),
	});
}

export async function apiGetRecentSubmissionsForProblem(
	token: string,
	problem_id: number,
	user_id: string,
): Promise<Submission[]> {
	return apiFetchJson(
		`/v1/user_problem_submissions/${user_id}/${problem_id}`,
		{ headers: authHeaders(token) },
	);
}
