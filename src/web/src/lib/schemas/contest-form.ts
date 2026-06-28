import { z } from "zod";

export const contestFormSchema = z
  .object({
    startTime: z.date({ required_error: "Start time is required" }),
    endTime: z.date({ required_error: "End time is required" }),
    description: z
      .string({ required_error: "Description is required" })
      .min(1, { message: "Description is required" }),
    title: z
      .string({ required_error: "Title is required" })
      .min(1, { message: "Title is required" }),
    teams: z.boolean().default(false),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type ContestFormValues = z.infer<typeof contestFormSchema>;

export const contestFormDefaultValues: Partial<ContestFormValues> = {
  title: "",
  description: "",
  startTime: new Date(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  teams: false,
};
