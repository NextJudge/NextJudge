import { z } from "zod";

export const userSchema = z.object({
	id: z.string(),
	account_identifier: z.string(),
	name: z.string(),
	email: z.string(),
	emailVerified: z.string(),
	image: z.string(),
	join_date: z.string(),
	is_admin: z.boolean(),
});

export const userWithStatsSchema = userSchema.extend({
	contest_count: z.number(),
	submission_count: z.number(),
});

export const countResponseSchema = z.object({
	count: z.number().optional(),
});

export type UserSchema = z.infer<typeof userSchema>;
export type UserWithStatsSchema = z.infer<typeof userWithStatsSchema>;

export const parseUser = (data: unknown): UserSchema => userSchema.parse(data);

export const parseUserList = (data: unknown): UserSchema[] =>
	z.array(userSchema).parse(data);

export const parseUserWithStatsList = (data: unknown): UserWithStatsSchema[] =>
	z.array(userWithStatsSchema).parse(data);

export const parseCountResponse = (data: unknown): number => {
	const parsed = countResponseSchema.parse(data);
	return parsed.count ?? 0;
};
