import { z } from "zod";
import { apiFetchParsed, authHeaders, jsonAuthHeaders } from "./client";

const judgeWorkerSchema = z.object({
	worker_id: z.string(),
	hostname: z.string(),
	last_seen: z.string(),
});

const judgeQueueStatsSchema = z.object({
	rabbitmq_messages: z.number(),
	rabbitmq_dlq_messages: z.number(),
	pending_submissions: z.number(),
	pending_input_submissions: z.number(),
	failed_enqueue_submissions: z.number(),
	failed_enqueue_input_submissions: z.number(),
});

const drainQueueResponseSchema = z.object({
	processed_submissions: z.number(),
	processed_input_submissions: z.number(),
});

const rejudgeSubmissionResponseSchema = z.object({
	submission_id: z.string(),
	status: z.string(),
});

export type JudgeWorker = z.infer<typeof judgeWorkerSchema>;
export type JudgeQueueStats = z.infer<typeof judgeQueueStatsSchema>;
export type DrainQueueResponse = z.infer<typeof drainQueueResponseSchema>;
export type RejudgeSubmissionResponse = z.infer<
	typeof rejudgeSubmissionResponseSchema
>;

const parseJudgeWorkers = (data: unknown): JudgeWorker[] =>
	z.array(judgeWorkerSchema).parse(data);

export async function apiGetJudgeWorkers(token: string): Promise<JudgeWorker[]> {
	return apiFetchParsed("/v1/judge_workers", parseJudgeWorkers, {
		headers: authHeaders(token),
	});
}

export async function apiGetJudgeQueueStats(
	token: string,
): Promise<JudgeQueueStats> {
	return apiFetchParsed(
		"/v1/admin/judge/queue",
		(data) => judgeQueueStatsSchema.parse(data),
		{ headers: authHeaders(token) },
	);
}

export async function apiDrainJudgeQueue(
	token: string,
): Promise<DrainQueueResponse> {
	return apiFetchParsed(
		"/v1/admin/judge/drain",
		(data) => drainQueueResponseSchema.parse(data),
		{
			method: "POST",
			headers: jsonAuthHeaders(token),
		},
	);
}

export async function apiRejudgeSubmission(
	token: string,
	submissionId: string,
): Promise<RejudgeSubmissionResponse> {
	return apiFetchParsed(
		`/v1/admin/submissions/${submissionId}/rejudge`,
		(data) => rejudgeSubmissionResponseSchema.parse(data),
		{
			method: "POST",
			headers: jsonAuthHeaders(token),
		},
	);
}
