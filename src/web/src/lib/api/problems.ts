import { ProblemRequest } from "../types";
import {
	type ProblemDetail,
	type ProblemListItem,
	type PostProblemResponse,
	parsePostProblemResponse,
	parseProblemDetail,
	parseProblemList,
	parseProblemListItem,
} from "../schemas/problem";
import { apiFetch, authHeaders, jsonAuthHeaders } from "./client";

export async function apiGetProblems(
	token: string,
): Promise<ProblemListItem[]> {
	const response = await apiFetch("/v1/problems", {
		headers: authHeaders(token),
	});
	const json: unknown = await response.json();
	return parseProblemList(json);
}

export async function apiGetProblem(
	token: string,
	problemId: number,
): Promise<ProblemDetail> {
	const response = await apiFetch(`/v1/problems/${problemId}`, {
		headers: authHeaders(token),
	});
	const json: unknown = await response.json();
	return parseProblemDetail(json);
}

/** @deprecated use apiGetProblem */
export async function fetchProblemID(
	token: string,
	id: number,
): Promise<ProblemDetail> {
	return apiGetProblem(token, id);
}

export async function apiToggleProblemVisibility(
	token: string,
	problemId: number,
): Promise<ProblemListItem> {
	const response = await apiFetch(
		`/v1/admin/problems/${problemId}/toggle-visibility`,
		{
			method: "PUT",
			headers: authHeaders(token),
		},
	);
	const json: unknown = await response.json();
	return parseProblemListItem(json);
}

export async function apiCreateProblem(
	token: string,
	data: ProblemRequest,
): Promise<PostProblemResponse> {
	const response = await apiFetch("/v1/problems", {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(data),
	});
	const json: unknown = await response.json();
	return parsePostProblemResponse(json);
}

export async function apiUpdateProblem(
	token: string,
	problemId: number,
	data: ProblemRequest,
): Promise<PostProblemResponse> {
	const response = await apiFetch(`/v1/problems/${problemId}`, {
		method: "PUT",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(data),
	});
	const json: unknown = await response.json();
	return parsePostProblemResponse(json);
}

export async function apiDeleteProblem(
	token: string,
	problemId: number,
): Promise<void> {
	await apiFetch(`/v1/problems/${problemId}`, {
		method: "DELETE",
		headers: authHeaders(token),
	});
}
