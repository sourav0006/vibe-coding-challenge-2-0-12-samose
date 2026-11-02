import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const createScoutSchema = z.object({
  userId: objectIdSchema,
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters long" })
    .max(100, { message: "Full name cannot exceed 100 characters" }),
  isActive: z.boolean().default(true),
});

export const updateScoutSchema = createScoutSchema.partial().omit({ userId: true });

export type CreateScoutInput = z.infer<typeof createScoutSchema>;
export type UpdateScoutInput = z.infer<typeof updateScoutSchema>;
