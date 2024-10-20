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
  user_id: z.string(),
  upload_date: z.string(),
  // author: z.string(),
});

export const recentSubmissionSchema = z.object({
  id: z.string(),
  time: z.date(),
  problem: problemSchema,
  language: z.string(),
  status: z.string(),
});

const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const CategoriesSchema = z.array(CategorySchema);

export type Category = z.infer<typeof CategorySchema>;
export type Categories = z.infer<typeof CategoriesSchema>;
export type Problem = z.infer<typeof problemSchema>;
export type RecentSubmission = z.infer<typeof recentSubmissionSchema>;
