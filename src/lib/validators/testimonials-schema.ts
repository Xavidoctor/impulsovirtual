import { z } from "zod";

const nullableString = z.string().trim().max(300).nullable().optional();

export const testimonialCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: nullableString,
  role: nullableString,
  quote: z.string().trim().min(10).max(1200),
  avatar_url: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
});

export const testimonialUpdateSchema = testimonialCreateSchema.extend({
  id: z.string().uuid(),
});

export const testimonialDeleteSchema = z.object({
  id: z.string().uuid(),
});
