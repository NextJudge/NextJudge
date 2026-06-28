import { z } from "zod";
import { eventQuestionSchema } from "./event";

export const notificationCountSchema = z.object({
	count: z.number(),
});

export const notificationSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	event_id: z.number(),
	question_id: z.string(),
	notification_type: z.enum(["question", "answer"]),
	is_read: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	question: eventQuestionSchema.optional(),
});

export type NotificationCountSchema = z.infer<typeof notificationCountSchema>;
export type NotificationSchema = z.infer<typeof notificationSchema>;

export const parseNotificationCount = (
	data: unknown,
): NotificationCountSchema => notificationCountSchema.parse(data);

export const parseNotificationList = (data: unknown): NotificationSchema[] =>
	z.array(notificationSchema).parse(data);
