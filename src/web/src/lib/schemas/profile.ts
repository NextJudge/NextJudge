import { z } from "zod";

export const publicProfileSchema = z.object({
	id: z.string(),
	handle: z.string(),
	name: z.string(),
	image: z.string().optional().default(""),
	join_date: z.string().optional().default(""),
	rating: z.number().optional(),
	max_rating: z.number().optional(),
	contest_count: z.number(),
	submission_count: z.number(),
});

export const updateHandleResponseSchema = z.object({
	handle: z.string(),
	handle_changed_at: z.string().optional(),
});

export type PublicProfileSchema = z.infer<typeof publicProfileSchema>;
export type UpdateHandleResponseSchema = z.infer<typeof updateHandleResponseSchema>;

export const parsePublicProfile = (data: unknown): PublicProfileSchema =>
	publicProfileSchema.parse(data);

export const parseUpdateHandleResponse = (
	data: unknown,
): UpdateHandleResponseSchema => updateHandleResponseSchema.parse(data);
