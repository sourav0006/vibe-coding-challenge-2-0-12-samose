import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const coachRemarkPayloadSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "Remark content cannot be empty" })
    .max(1000, { message: "Remark content cannot exceed 1000 characters" }),
});

export const createCoachRemarkSchema = z.object({
  playerId: objectIdSchema,
  content: z
    .string()
    .trim()
    .min(1, { message: "Remark content cannot be empty" })
    .max(1000, { message: "Remark content cannot exceed 1000 characters" }),
  coachId: objectIdSchema.optional(),
});

export const updateCoachRemarkSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "Remark content cannot be empty" })
    .max(1000, { message: "Remark content cannot exceed 1000 characters" }),
});

export type CoachRemarkPayloadInput = z.infer<typeof coachRemarkPayloadSchema>;
export type CreateCoachRemarkInput = z.infer<typeof createCoachRemarkSchema>;
export type UpdateCoachRemarkInput = z.infer<typeof updateCoachRemarkSchema>;
