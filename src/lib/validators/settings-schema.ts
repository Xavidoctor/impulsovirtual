import { z } from "zod";

export const settingKeySchema = z.enum([
  "contact",
  "social_links",
  "seo_global",
  "navigation",
  "whatsapp",
]);

const linkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(300),
});

export const contactSettingSchema = z.object({
  heading: z.string().trim().max(160).optional(),
  intro: z.string().trim().max(700).optional(),
  email: z.string().trim().email(),
  contactLabel: z.string().trim().max(80).optional(),
  copyEmail: z.string().trim().max(80).optional(),
  whatsappLabel: z.string().trim().max(80).optional(),
});

export const socialLinksSettingSchema = z.object({
  links: z.array(linkSchema).max(20).default([]),
});

export const seoGlobalSettingSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(220),
  ogImage: z.string().trim().min(1).max(500).optional(),
});

export const navigationSettingSchema = z.object({
  brand: z.string().trim().min(2).max(120),
  links: z.array(linkSchema).max(20).default([]),
});

export const whatsappSettingSchema = z.object({
  number: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[0-9]+$/, "El numero de WhatsApp solo puede contener digitos."),
  message: z.string().trim().min(5).max(600),
});

const settingsValueSchemaMap = {
  contact: contactSettingSchema,
  social_links: socialLinksSettingSchema,
  seo_global: seoGlobalSettingSchema,
  navigation: navigationSettingSchema,
  whatsapp: whatsappSettingSchema,
} as const;

export const settingUpsertSchema = z.object({
  key: settingKeySchema,
  valueJson: z.unknown(),
});

export function parseSettingValue(
  key: z.infer<typeof settingKeySchema>,
  valueJson: unknown,
) {
  return settingsValueSchemaMap[key].parse(valueJson);
}
