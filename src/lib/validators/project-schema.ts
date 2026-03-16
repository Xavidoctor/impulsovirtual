import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectStatusSchema = z.enum(["draft", "published", "archived"]);

export const projectSeoSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(220).optional(),
  ogImage: z.string().trim().url().optional(),
});

export const projectCreateSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(slugRegex),
  title: z.string().trim().min(2).max(180),
  subtitle: z.string().trim().max(220).optional().nullable(),
  excerpt: z.string().trim().max(500).optional().nullable(),
  bodyMarkdown: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  clientName: z.string().trim().max(140).optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  featured: z.boolean().default(false),
  status: projectStatusSchema.default("draft"),
  seoJson: projectSeoSchema.default({}),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.extend({
  id: z.string().uuid(),
});

export const projectDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const projectGetQuerySchema = z.object({
  id: z.string().uuid().optional(),
  status: projectStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
});
