import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" })
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .max(100, { message: "Password exceeds maximum length" }),
  requestedRole: z.enum(["coach", "player", "scout"], {
    message: "Requested role must be one of: coach, player, scout",
  }),
});

export const activateAccountSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" })
    .transform((val) => val.toLowerCase()),
  code: z
    .string()
    .trim()
    .min(6, { message: "Activation code must be at least 6 characters" })
    .max(32, { message: "Activation code cannot exceed 32 characters" })
    .transform((val) => val.toUpperCase()),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100, { message: "Password cannot exceed 100 characters" }),
});

export const issueActivationCodeSchema = z.object({
  userId: objectIdSchema,
  expiresInHours: z
    .number()
    .int()
    .min(1, { message: "Expiration must be at least 1 hour" })
    .max(168, { message: "Expiration cannot exceed 168 hours (7 days)" })
    .optional()
    .default(24),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
export type IssueActivationCodeInput = z.infer<typeof issueActivationCodeSchema>;
