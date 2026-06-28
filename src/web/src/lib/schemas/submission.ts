import { z } from "zod";
import { problemListItemSchema } from "./problem";
import { userSchema } from "./user";

export const submissionStatusSchema = z.enum([
	"ACCEPTED",
	"WRONG_ANSWER",
	"TIME_LIMIT_EXCEEDED",
	"MEMORY_LIMIT_EXCEEDED",
	"RUNTIME_ERROR",
	"COMPILE_TIME_ERROR",
	"PENDING",
]);

export const languageSchema = z.object({
	id: z.string(),
	name: z.string(),
	extension: z.string(),
	version: z.string(),
	template: z.string().optional(),
});

export const testCaseResultSchema = z.object({
	id: z.string(),
	submission_id: z.string(),
	test_case_id: z.string(),
	stdout: z.string(),
	stderr: z.string(),
	passed: z.boolean(),
});

export const submissionSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	user: userSchema.optional(),
	problem_id: z.number(),
	problem: problemListItemSchema,
	time_elapsed: z.number(),
	memory_used: z.number().optional(),
	language_id: z.string(),
	language: languageSchema,
	status: submissionStatusSchema,
	failed_test_case_id: z.string().optional(),
	submit_time: z.string(),
	source_code: z.string(),
	stdout: z.string(),
	stderr: z.string(),
	test_case_results: z.array(testCaseResultSchema).optional(),
});

export const submissionStatusPollSchema = z.object({
	id: z.string(),
	status: submissionStatusSchema,
});

export type SubmissionStatusSchema = z.infer<typeof submissionStatusSchema>;
export type LanguageSchema = z.infer<typeof languageSchema>;
export type SubmissionSchema = z.infer<typeof submissionSchema>;
export type SubmissionStatusPollSchema = z.infer<typeof submissionStatusPollSchema>;

export const parseSubmission = (data: unknown): SubmissionSchema =>
	submissionSchema.parse(data);

export const parseSubmissionList = (data: unknown): SubmissionSchema[] =>
	z.array(submissionSchema).parse(data);

export const parseSubmissionStatusPoll = (
	data: unknown,
): SubmissionStatusPollSchema => submissionStatusPollSchema.parse(data);

export const parseLanguageList = (data: unknown): LanguageSchema[] =>
	z.array(languageSchema).parse(data);
