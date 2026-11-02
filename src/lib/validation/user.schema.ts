import { z } from "zod";

export const userRoleSchema = z.enum(["coach", "player", "scout"], {
  message: "Role must be one of: coach, player, scout",
});

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address format" })
    .transform((val) => val.toLowerCase()),
  passwordHash: z.string().min(1, { message: "Password hash is required" }),
  role: userRoleSchema,
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
