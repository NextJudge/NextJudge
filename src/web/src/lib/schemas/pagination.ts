import { z } from "zod";

export const cursorPageSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
	z.object({
		items: z.array(itemSchema),
		next_cursor: z.string().optional(),
	});

export type CursorPageSchema<T extends z.ZodTypeAny> = z.infer<
	ReturnType<typeof cursorPageSchema<T>>
>;
