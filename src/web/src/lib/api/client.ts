import { getBridgeUrl } from "../utils";

export const authHeaders = (token: string) => ({
	Authorization: token,
});

export const jsonAuthHeaders = (token: string) => ({
	"Content-Type": "application/json",
	Authorization: token,
});

export const parseApiError = async (
	response: Response,
): Promise<never> => {
	const errorData = await response.json().catch(() => ({}));
	const message =
		typeof errorData === "object" &&
		errorData !== null &&
		"message" in errorData &&
		typeof errorData.message === "string"
			? errorData.message
			: `HTTP error! status: ${response.status}`;
	throw new Error(message);
};

export const apiUrl = (path: string) => `${getBridgeUrl()}${path}`;

export const apiFetch = async (
	path: string,
	init?: RequestInit,
): Promise<Response> => {
	const response = await fetch(apiUrl(path), init);
	if (!response.ok) {
		await parseApiError(response);
	}
	return response;
};

export const parseApiJson = <T>(
	json: unknown,
	parser: (data: unknown) => T,
): T => parser(json);

export const apiFetchParsed = async <T>(
	path: string,
	parser: (data: unknown) => T,
	init?: RequestInit,
): Promise<T> => {
	const response = await apiFetch(path, init);
	const json: unknown = await response.json();
	return parseApiJson(json, parser);
};

/** @deprecated use apiFetchParsed with a Zod parser */
export const apiFetchJson = async <T>(
	path: string,
	init?: RequestInit,
): Promise<T> => {
	const response = await apiFetch(path, init);
	const json: unknown = await response.json();
	return json as T;
};
