import { z } from "zod";
import { objectIdSchema, dateInputSchema } from "./common.schema";

export const sessionStatusSchema = z.enum(["open", "closed"], {
  message: "Session status must be either 'open' or 'closed'",
});

export const createPracticeSessionSchema = z.object({
  sportId: objectIdSchema,
  sessionDate: dateInputSchema,
  status: sessionStatusSchema.default("open"),
  closedAt: dateInputSchema.optional(),
});

export const updatePracticeSessionSchema = z.object({
  sessionDate: dateInputSchema.optional(),
  status: sessionStatusSchema.optional(),
  closedAt: dateInputSchema.optional(),
});

export const sessionQuerySchema = z.object({
  sportId: z.string().optional(),
  status: z.enum(["all", "open", "closed"]).default("all"),
  startDate: dateInputSchema.optional(),
  endDate: dateInputSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreatePracticeSessionInput = z.input<typeof createPracticeSessionSchema>;
export type CreatePracticeSessionOutput = z.infer<typeof createPracticeSessionSchema>;
export type UpdatePracticeSessionInput = z.infer<typeof updatePracticeSessionSchema>;
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>;
