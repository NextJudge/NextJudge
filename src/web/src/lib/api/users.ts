import { User } from "../types";
import {
	parseCountResponse,
	parseUser,
	parseUserList,
	parseUserWithStatsList,
} from "../schemas/user";
import { apiFetch, apiFetchParsed, authHeaders } from "./client";

export async function apiGetUser(
	token: string,
	user_id: string,
): Promise<User> {
	return apiFetchParsed(`/v1/users/${user_id}`, parseUser, {
		headers: authHeaders(token),
	});
}

export async function apiGetUsers(token: string): Promise<User[]> {
	return apiFetchParsed("/v1/users", parseUserList, {
		headers: authHeaders(token),
	});
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
	return apiFetchParsed(
		`/v1/users/${userId}/submissions/count`,
		parseCountResponse,
		{ headers: authHeaders(token) },
	);
}

export async function apiGetUserContestCount(
	token: string,
	userId: string,
): Promise<number> {
	return apiFetchParsed(
		`/v1/users/${userId}/contests/count`,
		parseCountResponse,
		{ headers: authHeaders(token) },
	);
}

export async function apiGetTopUsersByContests(
	token: string,
	limit: number = 10,
): Promise<Array<User & { contest_count: number; submission_count: number }>> {
	return apiFetchParsed(
		`/v1/users/top-by-contests?limit=${limit}`,
		parseUserWithStatsList,
		{ headers: authHeaders(token) },
	);
}
