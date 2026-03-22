import { z } from "zod";

export const quoteRequestPublicSchema = z.object({
  fullName: z.string().trim().min(2, "Indica tu nombre."),
  email: z.string().trim().email("Introduce un email valido."),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  projectType: z.string().trim().max(120).optional().or(z.literal("")),
  requestedServices: z.array(z.string().trim().min(1)).default([]),
  budgetRange: z.string().trim().max(120).optional().or(z.literal("")),
  deadline: z.string().trim().max(120).optional().or(z.literal("")),
  projectSummary: z
    .string()
    .trim()
    .min(30, "Describe el proyecto con al menos 30 caracteres."),
  references: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().optional(),
});

export type QuoteRequestPublicInput = z.infer<typeof quoteRequestPublicSchema>;

