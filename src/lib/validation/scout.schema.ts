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

export const createScoutAccountSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters long" })
    .max(100, { message: "Full name cannot exceed 100 characters" }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address format" }),
});

export const scoutListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "pending", "archived"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateScoutInput = z.infer<typeof createScoutSchema>;
export type UpdateScoutInput = z.infer<typeof updateScoutSchema>;
export type CreateScoutAccountInput = z.infer<typeof createScoutAccountSchema>;
export type ScoutListQueryInput = z.infer<typeof scoutListQuerySchema>;
