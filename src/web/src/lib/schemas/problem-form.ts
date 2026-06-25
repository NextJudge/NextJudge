import { z } from "zod";

import { difficultySchema } from "./problem";

export const testCaseFormItemSchema = z.object({
  input: z.string().min(1, { message: "Input is required." }),
  expected_output: z.string().min(1, { message: "Expected output is required." }),
  hidden: z.boolean().default(false),
});

export const problemFormSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must be at least 2 characters." })
    .max(100, { message: "Title must not be longer than 100 characters." }),
  identifier: z
    .string()
    .min(2, { message: "Identifier must be at least 2 characters." })
    .max(50, { message: "Identifier must not be longer than 50 characters." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Identifier must only contain lowercase letters, numbers, and dashes.",
    }),
  prompt: z.string().min(8, {
    message: "You must enter a problem statement.",
  }),
  source: z.string().optional(),
  accept_timeout: z.number().positive().min(0.1, {
    message: "Accept timeout must be at least 0.1 seconds.",
  }),
  execution_timeout: z.number().positive().min(0.1, {
    message: "Execution timeout must be at least 0.1 seconds.",
  }),
  memory_limit: z.number().int().positive().min(1, {
    message: "Memory limit must be at least 1 MB.",
  }),
  difficulty: difficultySchema,
  problem_categories: z.array(z.string()).default([]),
  test_cases: z
    .array(testCaseFormItemSchema)
    .min(1, { message: "At least one test case is required." }),
  public: z.boolean().default(true),
});

export type ProblemFormValues = z.infer<typeof problemFormSchema>;
export type TestCaseFormItem = z.infer<typeof testCaseFormItemSchema>;

export const addTestCaseFormSchema = testCaseFormItemSchema;

export type AddTestCaseFormValues = z.infer<typeof addTestCaseFormSchema>;

export const parseOptionalFloat = (value: string): number | undefined => {
  if (value.trim() === "") {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const parseOptionalInt = (value: string): number | undefined => {
  if (value.trim() === "") {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};
