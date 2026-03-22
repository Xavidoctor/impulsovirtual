import { z } from "zod";

export const faqCreateSchema = z.object({
  category: z.string().trim().max(120).nullable().optional(),
  question: z.string().trim().min(6).max(300),
  answer: z.string().trim().min(10).max(5000),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_published: z.boolean().default(true),
});

export const faqUpdateSchema = faqCreateSchema.extend({
  id: z.string().uuid(),
});

export const faqDeleteSchema = z.object({
  id: z.string().uuid(),
});
