import { z } from "zod";

export const difficultySchema = z.enum([
  "VERY EASY",
  "EASY",
  "MEDIUM",
  "HARD",
  "VERY HARD",
]);

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const testCaseSchema = z.object({
  id: z.string().optional(),
  problem_id: z.number().optional(),
  input: z.string(),
  expected_output: z.string(),
  hidden: z.boolean(),
});

export const problemListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  prompt: z.string(),
  source: z.string().optional().default(""),
  difficulty: difficultySchema,
  user_id: z.string(),
  upload_date: z.string(),
  updated_at: z.string(),
  public: z.boolean().optional().default(false),
  accept_timeout: z.number(),
  execution_timeout: z.number(),
  memory_limit: z.number(),
  event_id: z.number().optional(),
  identifier: z.string().optional(),
  categories: z.array(categorySchema).optional(),
  test_cases: z.array(testCaseSchema).nullish(),
  timeout: z.number().optional(),
});

export const problemDetailSchema = problemListItemSchema.extend({
  identifier: z.string(),
  test_cases: z.array(testCaseSchema),
  categories: z.array(categorySchema).optional(),
});

export type ProblemListItem = z.infer<typeof problemListItemSchema>;
export type ProblemDetail = z.infer<typeof problemDetailSchema>;

export const parseProblemListItem = (data: unknown): ProblemListItem =>
  problemListItemSchema.parse(data);

export const parseProblemList = (data: unknown): ProblemListItem[] =>
  z.array(problemListItemSchema).parse(data);

export const parseProblemDetail = (data: unknown): ProblemDetail =>
  problemDetailSchema.parse(data);
