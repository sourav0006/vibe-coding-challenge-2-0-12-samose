import { z } from "zod";

export const readinessStatusSchema = z.enum(["all", "ready", "not_ready"]);

export const readinessQuerySchema = z.object({
  sportId: z.string().optional(),
  status: readinessStatusSchema.default("all"),
  search: z.string().optional(),
  sortBy: z.enum(["attendance", "matches", "name"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const scoutQuerySchema = z.object({
  sportId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ReadinessQueryInput = z.infer<typeof readinessQuerySchema>;
export type ScoutQueryInput = z.infer<typeof scoutQuerySchema>;
