import { z } from "zod";

export const problemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  submissions: z.number(),
  author: z.string(),
});

export const recentSubmissionSchema = z.object({
  id: z.string(),
  time: z.date(),
  problem: problemSchema,
  language: z.string(),
  status: z.string(),
});

export type Problem = z.infer<typeof problemSchema>;

export type RecentSubmission = z.infer<typeof recentSubmissionSchema>;
