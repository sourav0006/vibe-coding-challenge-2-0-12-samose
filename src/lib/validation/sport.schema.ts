import { z } from "zod";

export const createSportSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Sport name must be at least 2 characters long" })
    .max(40, { message: "Sport name cannot exceed 40 characters" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  isActive: z.boolean().default(true),
});

export const updateSportSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Sport name must be at least 2 characters long" })
    .max(40, { message: "Sport name cannot exceed 40 characters" })
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateSportStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateSportInput = z.infer<typeof createSportSchema>;
export type UpdateSportInput = z.infer<typeof updateSportSchema>;
export type UpdateSportStatusInput = z.infer<typeof updateSportStatusSchema>;
