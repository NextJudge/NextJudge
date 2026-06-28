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

export const persistedTestCaseSchema = testCaseSchema.extend({
  id: z.string(),
  problem_id: z.number(),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const readString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

/** Normalizes ProblemDescription and GetEventProblemType payloads into one shape. */
export const normalizeProblemPayload = (data: unknown): unknown => {
  if (!isRecord(data)) {
    return data;
  }

  if (isRecord(data.problem) && !("title" in data)) {
    return normalizeProblemPayload(data.problem);
  }

  const acceptTimeout =
    readNumber(data.accept_timeout) ??
    readNumber(data.default_accept_timeout) ??
    readNumber(data.timeout) ??
    10;
  const executionTimeout =
    readNumber(data.execution_timeout) ??
    readNumber(data.default_execution_timeout) ??
    acceptTimeout;
  const memoryLimit =
    readNumber(data.memory_limit) ??
    readNumber(data.default_memory_timeout) ??
    256;

  const testCases = data.test_cases ?? data.tests;

  return {
    ...data,
    source: readString(data.source) ?? "",
    public: typeof data.public === "boolean" ? data.public : false,
    user_id:
      readString(data.user_id) ??
      (data.user_id != null ? String(data.user_id) : ""),
    upload_date: data.upload_date,
    updated_at: data.updated_at,
    accept_timeout: acceptTimeout,
    execution_timeout: executionTimeout,
    memory_limit: memoryLimit,
    test_cases: testCases,
  };
};

const problemListItemCoreSchema = z.object({
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

export const problemListItemSchema = z.preprocess(
  normalizeProblemPayload,
  problemListItemCoreSchema,
);

/** Partial problem embedded in submission list responses. */
export const problemSummarySchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  difficulty: difficultySchema.optional(),
  identifier: z.string().optional(),
});

export const parsedProblemSchema = z.preprocess(
  normalizeProblemPayload,
  problemListItemCoreSchema,
);

export const optionalParsedProblemSchema = z
  .union([parsedProblemSchema, problemSummarySchema])
  .optional()
  .nullable();

const normalizeProblemDetailPayload = (data: unknown): unknown => {
  const normalized = normalizeProblemPayload(data);
  if (!isRecord(normalized)) {
    return normalized;
  }

  const title = readString(normalized.title) ?? "Untitled problem";
  const identifier =
    readString(normalized.identifier) ??
    title.split(/\s+/).join("-").toLowerCase();

  return {
    ...normalized,
    identifier,
    test_cases: Array.isArray(normalized.test_cases) ? normalized.test_cases : [],
  };
};

export const problemDetailSchema = z.preprocess(
  normalizeProblemDetailPayload,
  problemListItemCoreSchema.extend({
    identifier: z.string(),
    test_cases: z.array(persistedTestCaseSchema),
    categories: z.array(categorySchema).optional(),
  }),
);

export const postProblemResponseSchema = z.object({
  id: z.number(),
  event_problem_id: z.number().optional(),
});

export type TestCase = z.infer<typeof testCaseSchema>;
export type PersistedTestCase = z.infer<typeof persistedTestCaseSchema>;
export type ProblemListItem = z.infer<typeof problemListItemSchema>;
export type ProblemSummary = z.infer<typeof problemSummarySchema>;
export type ProblemDetail = z.infer<typeof problemDetailSchema>;
export type PostProblemResponse = z.infer<typeof postProblemResponseSchema>;

export const parseProblemListItem = (data: unknown): ProblemListItem =>
  problemListItemSchema.parse(data);

export const parseProblemList = (data: unknown): ProblemListItem[] =>
  z.array(problemListItemSchema).parse(data);

export const parseProblemDetail = (data: unknown): ProblemDetail =>
  problemDetailSchema.parse(data);

export const parsePostProblemResponse = (data: unknown): PostProblemResponse =>
  postProblemResponseSchema.parse(data);
