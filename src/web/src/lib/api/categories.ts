import { z } from "zod";
import { Category } from "../types";
import { categorySchema } from "../schemas/problem";
import { apiFetchParsed, authHeaders } from "./client";

const parseCategoryList = (data: unknown): Category[] =>
	z.array(categorySchema).parse(data);

export async function apiGetCategories(token: string): Promise<Category[]> {
	return apiFetchParsed("/v1/categories", parseCategoryList, {
		headers: authHeaders(token),
	});
}

export async function apiGetProblemCategories(
	token: string,
	problem_id: number,
): Promise<Category[]> {
	return apiFetchParsed(
		`/v1/categories/${problem_id}`,
		parseCategoryList,
		{ headers: authHeaders(token) },
	);
}
