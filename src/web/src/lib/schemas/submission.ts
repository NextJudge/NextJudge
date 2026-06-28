import { z } from "zod";
import {
	optionalParsedProblemSchema,
	parsedProblemSchema,
} from "./problem";
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

const submissionFieldsSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	user: userSchema.optional().nullable(),
	problem_id: z.number(),
	time_elapsed: z.number(),
	memory_used: z.number().optional(),
	language_id: z.string(),
	status: submissionStatusSchema,
	failed_test_case_id: z.string().optional().nullable(),
	submit_time: z.string(),
	source_code: z.string().optional().default(""),
	stdout: z.string().optional().default(""),
	stderr: z.string().optional().default(""),
	test_case_results: z.array(testCaseResultSchema).optional(),
});

export const submissionSchema = submissionFieldsSchema.extend({
	problem: optionalParsedProblemSchema,
	language: languageSchema.optional().nullable(),
});

export const submissionListItemSchema = submissionFieldsSchema.extend({
	problem: optionalParsedProblemSchema,
	language: languageSchema.optional().nullable(),
});

export const submissionStatusPollSchema = z.object({
	id: z.string(),
	status: submissionStatusSchema,
});

export type SubmissionStatusSchema = z.infer<typeof submissionStatusSchema>;
export type LanguageSchema = z.infer<typeof languageSchema>;
export type SubmissionSchema = z.infer<typeof submissionSchema>;
export type SubmissionListItemSchema = z.infer<typeof submissionListItemSchema>;
export type SubmissionStatusPollSchema = z.infer<typeof submissionStatusPollSchema>;

export const parseSubmission = (data: unknown): SubmissionSchema =>
	submissionSchema.parse(data);

export const parseSubmissionList = (data: unknown): SubmissionListItemSchema[] =>
	z.array(submissionListItemSchema).parse(data);

export const parseSubmissionStatusPoll = (
	data: unknown,
): SubmissionStatusPollSchema => submissionStatusPollSchema.parse(data);

export const parseLanguageList = (data: unknown): LanguageSchema[] =>
	z.array(languageSchema).parse(data);
