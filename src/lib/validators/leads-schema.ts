import { z } from "zod";

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "closed_won",
  "closed_lost",
  "spam",
]);

export const leadListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: leadStatusSchema.optional(),
});

export const leadUpdateSchema = z
  .object({
    id: z.string().uuid(),
    status: leadStatusSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (value) => value.status !== undefined || value.notes !== undefined,
    {
      message: "Debes enviar al menos un cambio.",
    },
  );
