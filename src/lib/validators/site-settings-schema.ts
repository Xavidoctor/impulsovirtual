import { z } from "zod";

const nullableString = z.string().trim().max(500).nullable().optional();
const nullableEmail = z.string().trim().email().nullable().optional();

export const siteSettingsUpdateSchema = z.object({
  business_name: z.string().trim().min(2).max(140),
  hero_title: z.string().trim().max(220).nullable().optional(),
  hero_subtitle: z.string().trim().max(1000).nullable().optional(),
  hero_cta_primary: z.string().trim().max(80).nullable().optional(),
  hero_cta_secondary: z.string().trim().max(80).nullable().optional(),
  contact_email: nullableEmail,
  contact_phone: nullableString,
  whatsapp_url: nullableString,
  location: z.string().trim().max(240).nullable().optional(),
  linkedin_url: nullableString,
  instagram_url: nullableString,
  behance_url: nullableString,
  default_seo_title: z.string().trim().max(140).nullable().optional(),
  default_seo_description: z.string().trim().max(240).nullable().optional(),
  default_og_image_url: nullableString,
});

export const adminPanelSettingsUpdateSchema = z
  .object({
    contact_notification_email: z.string().trim().email(),
    contact_notifications_enabled: z.boolean(),
    contact_auto_reply_enabled: z.boolean(),
    contact_auto_reply_subject: z.string().trim().min(3).max(180),
    contact_auto_reply_body: z.string().trim().min(5).max(2000),
    alerts_enabled: z.boolean(),
    vercel_plan: z.string().trim().min(2).max(120),
    supabase_plan: z.string().trim().min(2).max(120),
    r2_plan_mode: z.string().trim().min(2).max(120),
    email_provider: z.string().trim().min(2).max(80),
    usage_warning_threshold: z.number().int().min(50).max(95),
    usage_danger_threshold: z.number().int().min(60).max(99),
    email_daily_limit: z.number().int().positive().nullable().optional(),
    email_monthly_limit: z.number().int().positive().nullable().optional(),
  })
  .refine((value) => value.usage_danger_threshold > value.usage_warning_threshold, {
    message: "El umbral de peligro debe ser mayor al de advertencia.",
    path: ["usage_danger_threshold"],
  });

export const adminSettingsUpdateSchema = z.object({
  site: siteSettingsUpdateSchema,
  admin_panel: adminPanelSettingsUpdateSchema.optional(),
});
