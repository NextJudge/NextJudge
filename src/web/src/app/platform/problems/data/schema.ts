import { z } from "zod";

// TODO: Actually migrate here
export const oldProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  submissions: z.number(),
  author: z.string(),
});

export const problemSchema = z.object({
  id: z.number(),
  title: z.string(),
  prompt: z.string(),
  timeout: z.number(),
  user_id: z.number(),
  upload_date: z.date(),
  author: z.string(),
});

export const recentSubmissionSchema = z.object({
  id: z.string(),
  time: z.date(),
  problem: oldProblemSchema,
  language: z.string(),
  status: z.string(),
});

export type Problem = z.infer<typeof oldProblemSchema>;

export type RecentSubmission = z.infer<typeof recentSubmissionSchema>;
