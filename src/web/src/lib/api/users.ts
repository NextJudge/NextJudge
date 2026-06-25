import { User } from "../types";
import { apiFetch, apiFetchJson, authHeaders } from "./client";

export async function apiGetUser(
	token: string,
	user_id: string,
): Promise<User> {
	return apiFetchJson(`/v1/users/${user_id}`, {
		headers: authHeaders(token),
	});
}

export async function apiGetUsers(token: string): Promise<User[]> {
	return apiFetchJson("/v1/users", { headers: authHeaders(token) });
}

export async function apiDeleteUser(
	token: string,
	userId: string,
): Promise<void> {
	await apiFetch(`/v1/users/${userId}`, {
		method: "DELETE",
		headers: authHeaders(token),
	});
}

export async function apiGetUserSubmissionCount(
	token: string,
	userId: string,
): Promise<number> {
	const data = await apiFetchJson<{ count?: number }>(
		`/v1/users/${userId}/submissions/count`,
		{ headers: authHeaders(token) },
	);
	return data.count ?? 0;
}

export async function apiGetUserContestCount(
	token: string,
	userId: string,
): Promise<number> {
	const data = await apiFetchJson<{ count?: number }>(
		`/v1/users/${userId}/contests/count`,
		{ headers: authHeaders(token) },
	);
	return data.count ?? 0;
}

export async function apiGetTopUsersByContests(
	token: string,
	limit: number = 10,
): Promise<Array<User & { contest_count: number; submission_count: number }>> {
	return apiFetchJson(`/v1/users/top-by-contests?limit=${limit}`, {
		headers: authHeaders(token),
	});
}
