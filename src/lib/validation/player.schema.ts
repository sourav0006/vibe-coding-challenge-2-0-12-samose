import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const createPlayerSchema = z.object({
  userId: objectIdSchema,
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters long" })
    .max(100, { message: "Full name cannot exceed 100 characters" }),
  age: z
    .number({ message: "Age must be a valid number" })
    .int({ message: "Age must be an integer" })
    .min(4, { message: "Player age must be at least 4 years" })
    .max(100, { message: "Player age cannot exceed 100 years" }),
  sportId: objectIdSchema,
  isActive: z.boolean().default(true),
});

export const updatePlayerSchema = createPlayerSchema.partial().omit({ userId: true });

export const createPlayerAccountSchema = z.object({
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
  age: z.coerce
    .number({ message: "Age must be a valid number" })
    .int({ message: "Age must be an integer" })
    .min(4, { message: "Player age must be at least 4 years" })
    .max(100, { message: "Player age cannot exceed 100 years" }),
  sportId: objectIdSchema,
});

export const updatePlayerDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters long" })
    .max(100, { message: "Full name cannot exceed 100 characters" })
    .optional(),
  age: z.coerce
    .number({ message: "Age must be a valid number" })
    .int({ message: "Age must be an integer" })
    .min(4, { message: "Player age must be at least 4 years" })
    .max(100, { message: "Player age cannot exceed 100 years" })
    .optional(),
  sportId: objectIdSchema.optional(),
});

export const updatePlayerStatusSchema = z.object({
  isActive: z.boolean(),
});

export const playerQuerySchema = z.object({
  search: z.string().trim().optional(),
  sportId: z.string().trim().optional(),
  status: z.enum(["all", "active", "pending", "archived"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreatePlayerAccountInput = z.infer<typeof createPlayerAccountSchema>;
export type UpdatePlayerDetailsInput = z.infer<typeof updatePlayerDetailsSchema>;
export type UpdatePlayerStatusInput = z.infer<typeof updatePlayerStatusSchema>;
export type PlayerQueryInput = z.infer<typeof playerQuerySchema>;
