import { z } from "zod";
import { submissionStatusSchema } from "./submission";

const customInputPendingSchema = z.object({
	status: z.literal("PENDING"),
});

const customInputFinishedSchema = z.object({
	status: submissionStatusSchema.exclude(["PENDING"]),
	stdout: z.string(),
	stderr: z.string(),
	finished: z.boolean(),
	runtime: z.number(),
});

export const customInputResultSchema = z.union([
	customInputPendingSchema,
	customInputFinishedSchema,
]);

export type CustomInputPendingSchema = z.infer<typeof customInputPendingSchema>;
export type CustomInputFinishedSchema = z.infer<typeof customInputFinishedSchema>;
export type CustomInputResultSchema = z.infer<typeof customInputResultSchema>;

export const parseCustomInputResult = (
	data: unknown,
): CustomInputResultSchema => customInputResultSchema.parse(data);

export const isCustomInputPending = (
	result: CustomInputResultSchema,
): result is CustomInputPendingSchema => result.status === "PENDING";

export const isCustomInputFinished = (
	result: CustomInputResultSchema,
): result is CustomInputFinishedSchema => !isCustomInputPending(result);
