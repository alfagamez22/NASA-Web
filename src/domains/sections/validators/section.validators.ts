import { z } from "zod";

// ── Sections ──
const mediaSchema = z.object({
  type: z.string().optional().default("image"),
  url: z.string().nullable().optional(),
  gurl: z.string().nullable().optional(),
  yurl: z.string().nullable().optional(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
});

const linkSchema = z.object({
  label: z.string().default(""),
  url: z.string().default(""),
});

const columnSchema = z.object({
  type: z.string().default("text"),
  content: z.string().nullable().optional(),
  media: z
    .object({
      type: z.string().optional(),
      url: z.string().optional(),
      gurl: z.string().optional(),
      yurl: z.string().optional(),
    })
    .optional(),
});

const slideSchema = z.object({
  slug: z.string().optional(),
  title: z.string().default(""),
  layout: z.string().default("single"),
  columns: z.array(columnSchema).optional(),
});

export const createSectionSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  parentSlug: z.string().min(1, "Parent slug is required"),
  description: z.string().optional().default(""),
  content: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  authorUrl: z.string().nullable().optional(),
  colSpan: z.number().int().optional().default(1),
  order: z.number().int().optional().default(0),
  buttonLabel: z.string().nullable().optional(),
  buttonUrl: z.string().nullable().optional(),
  media: z.array(mediaSchema).optional(),
  links: z.array(linkSchema).optional(),
  slides: z.array(slideSchema).optional(),
});

export const updateSectionSchema = z.object({
  slug: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  authorUrl: z.string().nullable().optional(),
  colSpan: z.number().int().optional(),
  order: z.number().int().optional(),
  buttonLabel: z.string().nullable().optional(),
  buttonUrl: z.string().nullable().optional(),
  media: z.array(mediaSchema).optional(),
  links: z.array(linkSchema).optional(),
  slides: z.array(slideSchema).optional(),
});

export type CreateSectionDto = z.infer<typeof createSectionSchema>;
export type UpdateSectionDto = z.infer<typeof updateSectionSchema>;
