import { z } from "zod";
import { objectIdSchema, dateInputSchema } from "./common.schema";

export const matchStatusSchema = z.enum(["draft", "finalized"], {
  message: "Match status must be either 'draft' or 'finalized'",
});

export const createMatchSchema = z.object({
  sportId: objectIdSchema,
  matchDate: dateInputSchema,
  opponentName: z
    .string({ message: "Opponent name is required" })
    .trim()
    .min(2, { message: "Opponent name must be at least 2 characters long" })
    .max(100, { message: "Opponent name cannot exceed 100 characters" }),
  status: matchStatusSchema.default("draft"),
  finalizedAt: dateInputSchema.optional(),
});

export const updateMatchSchema = z.object({
  sportId: objectIdSchema.optional(),
  matchDate: dateInputSchema.optional(),
  opponentName: z
    .string()
    .trim()
    .min(2, { message: "Opponent name must be at least 2 characters long" })
    .max(100, { message: "Opponent name cannot exceed 100 characters" })
    .optional(),
  status: matchStatusSchema.optional(),
  finalizedAt: dateInputSchema.optional(),
});

export const matchQuerySchema = z.object({
  sportId: z.string().optional(),
  status: z.enum(["all", "draft", "finalized"]).default("all"),
  startDate: dateInputSchema.optional(),
  endDate: dateInputSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreateMatchInput = z.input<typeof createMatchSchema>;
export type CreateMatchOutput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type MatchQueryInput = z.infer<typeof matchQuerySchema>;
