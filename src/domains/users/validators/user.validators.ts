import { z } from "zod";

// ── Users ──
export const createUserSchema = z.object({
  username: z.string().min(1, "Username is required").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["viewer", "editor", "admin", "super_admin"]).optional().default("viewer"),
});

export const updateUserSchema = z.object({
  id: z.string().min(1, "User id required"),
  username: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  role: z.enum(["viewer", "editor", "admin", "super_admin"]).optional(),
  password: z.string().min(8).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
