import { z } from "zod";
import { CONTACT_FORM_MIN_MESSAGE } from "@/lib/constants";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().email("Introduce un email válido."),
  phone: z
    .string()
    .trim()
    .max(40, "El teléfono es demasiado largo.")
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(100, "La empresa es demasiado larga.").optional().or(z.literal("")),
  service: z.string().trim().min(2, "Selecciona un servicio."),
  message: z
    .string()
    .trim()
    .min(CONTACT_FORM_MIN_MESSAGE, `El mensaje debe tener al menos ${CONTACT_FORM_MIN_MESSAGE} caracteres.`),
  pageUrl: z.string().trim().max(500).optional(),
  source: z.string().trim().max(80).optional(),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  privacyAccepted: z
    .boolean()
    .refine((value) => value, "Debes aceptar la política de privacidad."),
  website: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
