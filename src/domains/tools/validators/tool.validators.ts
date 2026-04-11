import { z } from "zod";

// ── Tools ──
export const createToolSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  icon: z.string().optional().default("Monitor"),
  description: z.string().optional().default(""),
  categorySlug: z.string().min(1, "Category is required"),
  order: z.number().int().optional().default(0),
});

export const updateToolSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  categorySlug: z.string().optional(),
  order: z.number().int().optional(),
});

export type CreateToolDto = z.infer<typeof createToolSchema>;
export type UpdateToolDto = z.infer<typeof updateToolSchema>;
