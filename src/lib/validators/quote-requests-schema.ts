import { z } from "zod";

export const quoteRequestStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "closed_won",
  "closed_lost",
]);

export const quoteRequestListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: quoteRequestStatusSchema.optional(),
});

export const quoteRequestUpdateSchema = z
  .object({
    id: z.string().uuid(),
    status: quoteRequestStatusSchema.optional(),
    notes: z.string().trim().max(3000).optional(),
  })
  .refine((value) => value.status !== undefined || value.notes !== undefined, {
    message: "Debes enviar al menos un cambio.",
  });

