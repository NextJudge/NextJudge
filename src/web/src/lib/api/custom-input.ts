import { CustomInputResult } from "../types";
import { parseCustomInputResult } from "../schemas/custom-input";
import {
	apiFetchParsed,
	apiUrl,
	jsonAuthHeaders,
	parseApiError,
} from "./client";

export async function waitForCustomInputResult(
	token: string,
	runId: string,
	intervalMs = 500,
): Promise<CustomInputResult> {
	let result = await getCustomInputSubmissionStatus(token, runId);
	while (!result.finished && result.status === "PENDING") {
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
		result = await getCustomInputSubmissionStatus(token, runId);
	}
	return result;
}

export async function postCustomInputSubmission(
	token: string,
	code: string,
	languageId: string,
	stdin: string,
): Promise<string> {
	const response = await fetch(apiUrl("/v1/input_submissions"), {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify({
			source_code: code,
			language_id: languageId,
			stdin,
		}),
	});

	if (!response.ok) {
		await parseApiError(response);
	}

	return response.text();
}

export async function getCustomInputSubmissionStatus(
	token: string,
	submissionId: string,
): Promise<CustomInputResult> {
	return apiFetchParsed(
		`/v1/input_submissions/${submissionId}`,
		parseCustomInputResult,
		{ headers: jsonAuthHeaders(token) },
	);
}

export async function postPublicCustomInputSubmission(
	code: string,
	languageId: string,
	stdin: string,
	options?: { benchmark?: boolean },
): Promise<string> {
	const endpoint = options?.benchmark
		? "/v1/bench/input_submissions"
		: "/v1/public/input_submissions";

	const response = await fetch(apiUrl(endpoint), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			source_code: code,
			language_id: languageId,
			stdin,
		}),
	});

	if (!response.ok) {
		if (response.status === 429) {
			throw new Error("RATE_LIMIT_EXCEEDED");
		}
		await parseApiError(response);
	}

	return response.text();
}

export async function getPublicCustomInputSubmissionStatus(
	submissionId: string,
	options?: { benchmark?: boolean },
): Promise<CustomInputResult> {
	const endpoint = options?.benchmark
		? "/v1/bench/input_submissions"
		: "/v1/public/input_submissions";

	return apiFetchParsed(
		`${endpoint}/${submissionId}`,
		parseCustomInputResult,
		{ headers: { "Content-Type": "application/json" } },
	);
}
