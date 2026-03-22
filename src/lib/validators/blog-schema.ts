import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe usar minúsculas y guiones.");

const nullableString = z.string().trim().max(600).nullable().optional();

export const blogCategoryCreateSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  description: nullableString,
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_published: z.boolean().default(true),
});

export const blogCategoryUpdateSchema = blogCategoryCreateSchema.extend({
  id: z.string().uuid(),
});

export const blogCategoryDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const blogPostCreateSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(180),
  excerpt: z.string().trim().min(10).max(320),
  content: z.string().trim().min(20).max(30000),
  cover_image_url: z.string().trim().max(500).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  author_name: z.string().trim().max(120).nullable().optional(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  published_at: z.string().datetime().nullable().optional(),
  seo_title: z.string().trim().max(140).nullable().optional(),
  seo_description: z.string().trim().max(240).nullable().optional(),
  og_image_url: z.string().trim().max(500).nullable().optional(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.extend({
  id: z.string().uuid(),
});

export const blogPostDeleteSchema = z.object({
  id: z.string().uuid(),
});
