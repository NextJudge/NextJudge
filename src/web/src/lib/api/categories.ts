import { Category } from "../types";
import { apiFetchJson, authHeaders } from "./client";

export async function apiGetCategories(token: string): Promise<Category[]> {
	return apiFetchJson("/v1/categories", { headers: authHeaders(token) });
}

export async function apiGetProblemCategories(
	token: string,
	problem_id: number,
) {
	return apiFetchJson(`/v1/categories/${problem_id}`, {
		headers: authHeaders(token),
	});
}
