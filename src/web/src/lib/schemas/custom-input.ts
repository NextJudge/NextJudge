import { z } from "zod";
import { submissionStatusSchema } from "./submission";

export const customInputResultSchema = z.object({
	status: submissionStatusSchema,
	stdout: z.string(),
	stderr: z.string(),
	finished: z.boolean(),
	runtime: z.number(),
});

export type CustomInputResultSchema = z.infer<typeof customInputResultSchema>;

export const parseCustomInputResult = (
	data: unknown,
): CustomInputResultSchema => customInputResultSchema.parse(data);
