import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe usar minúsculas y guiones.");

const optionalText = z.string().trim().max(500).nullable().optional();

export const serviceCreateSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(140),
  subtitle: optionalText,
  short_description: z.string().trim().min(10).max(240),
  full_description: z.string().trim().min(20).max(8000),
  cover_image_url: z.string().trim().max(500).nullable().optional(),
  icon_name: z.string().trim().max(80).nullable().optional(),
  featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_published: z.boolean().default(false),
  seo_title: z.string().trim().max(140).nullable().optional(),
  seo_description: z.string().trim().max(240).nullable().optional(),
});

export const serviceUpdateSchema = serviceCreateSchema.extend({
  id: z.string().uuid(),
});

export const serviceDeleteSchema = z.object({
  id: z.string().uuid(),
});
