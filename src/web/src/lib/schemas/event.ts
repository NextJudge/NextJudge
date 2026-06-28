import { z } from "zod";
import { problemListItemSchema } from "./problem";
import { userSchema } from "./user";

export const nextJudgeEventSchema = z.object({
	id: z.number(),
	user_id: z.string(),
	title: z.string(),
	description: z.string(),
	start_time: z.string(),
	end_time: z.string(),
	teams: z.boolean(),
	problems: z.array(problemListItemSchema).optional(),
	participants: z.array(userSchema).optional(),
	participant_count: z.number().optional(),
	problem_count: z.number().optional(),
});

export const eventTeamSchema = z.object({
	id: z.string(),
	event_id: z.number(),
	name: z.string(),
	members: z.array(userSchema).optional(),
});

export const createTeamResponseSchema = z.object({
	message: z.string(),
	team_id: z.string(),
});

export const eventProblemStatsSchema = z.object({
	problem_id: z.number(),
	accepted_count: z.number(),
});

export const userEventProblemStatusSchema = z.object({
	problem_id: z.number(),
	status: z.string(),
	submit_time: z.string(),
});

export const eventProblemAttemptSchema = z.object({
	user_id: z.string(),
	problem_id: z.number(),
	attempts: z.number(),
	total_attempts: z.number(),
	first_accepted_time: z.string().optional(),
	minutes_to_solve: z.number().optional(),
});

export const eventQuestionSchema = z.object({
	id: z.string(),
	event_id: z.number(),
	user_id: z.string(),
	problem_id: z.number().optional(),
	question: z.string(),
	is_answered: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	answer: z.string().optional(),
	answered_at: z.string().optional(),
	answered_by: z.string().optional(),
	user: userSchema.optional(),
	problem: problemListItemSchema.optional(),
	answerer: userSchema.optional(),
});

export type NextJudgeEventSchema = z.infer<typeof nextJudgeEventSchema>;
export type EventTeamSchema = z.infer<typeof eventTeamSchema>;
export type CreateTeamResponseSchema = z.infer<typeof createTeamResponseSchema>;
export type EventProblemStatsSchema = z.infer<typeof eventProblemStatsSchema>;
export type UserEventProblemStatusSchema = z.infer<
	typeof userEventProblemStatusSchema
>;
export type EventProblemAttemptSchema = z.infer<typeof eventProblemAttemptSchema>;
export type EventQuestionSchema = z.infer<typeof eventQuestionSchema>;

export const parseEvent = (data: unknown): NextJudgeEventSchema =>
	nextJudgeEventSchema.parse(data);

export const parseEventList = (data: unknown): NextJudgeEventSchema[] =>
	z.array(nextJudgeEventSchema).parse(data);

export const parseEventTeam = (data: unknown): EventTeamSchema =>
	eventTeamSchema.parse(data);

export const parseEventTeamList = (data: unknown): EventTeamSchema[] =>
	z.array(eventTeamSchema).parse(data);

export const parseCreateTeamResponse = (
	data: unknown,
): CreateTeamResponseSchema => createTeamResponseSchema.parse(data);

export const parseEventProblemStatsList = (
	data: unknown,
): EventProblemStatsSchema[] => z.array(eventProblemStatsSchema).parse(data);

export const parseUserEventProblemStatusList = (
	data: unknown,
): UserEventProblemStatusSchema[] =>
	z.array(userEventProblemStatusSchema).parse(data);

export const parseEventProblemAttemptList = (
	data: unknown,
): EventProblemAttemptSchema[] =>
	z.array(eventProblemAttemptSchema).parse(data);

export const parseEventQuestionList = (data: unknown): EventQuestionSchema[] =>
	z.array(eventQuestionSchema).parse(data);

export const parseEventQuestion = (data: unknown): EventQuestionSchema =>
	eventQuestionSchema.parse(data);
