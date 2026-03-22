import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe usar minúsculas y guiones.");

const optionalText = z.string().trim().max(1000).nullable().optional();
const optionalUrl = z.string().trim().max(500).nullable().optional();

export const projectListQuerySchema = z.object({
  id: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  includeUnpublished: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value ? value === "true" : undefined)),
});

const projectBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(180),
  client_name: optionalText,
  excerpt: z.string().trim().max(320).nullable().optional(),
  description: z.string().trim().max(12000).nullable().optional(),
  challenge: z.string().trim().max(6000).nullable().optional(),
  solution: z.string().trim().max(6000).nullable().optional(),
  results: z.string().trim().max(6000).nullable().optional(),
  cover_image_url: optionalUrl,
  company_logo_url: optionalUrl,
  website_url: optionalUrl,
  live_url: optionalUrl,
  featured: z.boolean().default(false),
  status: z.enum(["completed", "in_progress"]).default("completed"),
  progress_percentage: z.number().int().min(0).max(100).nullable().optional(),
  progress_label: z.string().trim().max(120).nullable().optional(),
  progress_note: z.string().trim().max(240).nullable().optional(),
  project_orientation: z.string().trim().max(180).nullable().optional(),
  what_was_done: z.string().trim().max(6000).nullable().optional(),
  services_applied: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  preview_mode: z.enum(["embed", "image", "external_only"]).default("embed"),
  preview_image_url: optionalUrl,
  is_published: z.boolean().default(false),
  published_at: z.string().datetime().nullable().optional(),
  seo_title: z.string().trim().max(140).nullable().optional(),
  seo_description: z.string().trim().max(240).nullable().optional(),
});

function validateProjectProgress(
  value: { status: "completed" | "in_progress"; progress_percentage?: number | null },
  ctx: z.RefinementCtx,
) {
  if (value.status === "in_progress" && value.progress_percentage == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["progress_percentage"],
      message: "El progreso es obligatorio para proyectos en desarrollo.",
    });
  }
}

export const projectCreateSchema = projectBaseSchema.superRefine(validateProjectProgress);

export const projectUpdateSchema = projectBaseSchema.extend({
  id: z.string().uuid(),
}).superRefine(validateProjectProgress);

export const projectDeleteSchema = z.object({
  id: z.string().uuid(),
});
