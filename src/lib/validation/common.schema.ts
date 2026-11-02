import { z } from "zod";

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string
 */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ID format. Must be a 24-character hex string." });

/**
 * Validates a coerceable ISO date string or Date instance
 */
export const dateInputSchema = z
  .union([z.string().datetime({ message: "Invalid ISO date string" }), z.date(), z.string().date()])
  .transform((val) => (typeof val === "string" ? new Date(val) : val));

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
