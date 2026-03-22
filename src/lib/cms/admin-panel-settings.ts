import type { SupabaseClient } from "@supabase/supabase-js";

import { brandConfig } from "@/content/brand";
import type { Database } from "@/src/types/database.types";

export const DEFAULT_CONTACT_NOTIFICATION_EMAIL = brandConfig.contact.email;

export type AdminPanelSettings = {
  contact_notification_email: string;
  contact_notifications_enabled: boolean;
  contact_auto_reply_enabled: boolean;
  contact_auto_reply_subject: string;
  contact_auto_reply_body: string;
  alerts_enabled: boolean;
  vercel_plan: string;
  supabase_plan: string;
  r2_plan_mode: string;
  email_provider: string;
  usage_warning_threshold: number;
  usage_danger_threshold: number;
  email_daily_limit: number | null;
  email_monthly_limit: number | null;
};

export const defaultAdminPanelSettings: AdminPanelSettings = {
  contact_notification_email: DEFAULT_CONTACT_NOTIFICATION_EMAIL,
  contact_notifications_enabled: true,
  contact_auto_reply_enabled: false,
  contact_auto_reply_subject: `Gracias por escribir a ${brandConfig.name}`,
  contact_auto_reply_body:
    "Hemos recibido tu mensaje y te responderemos lo antes posible.",
  alerts_enabled: true,
  vercel_plan: "sin definir",
  supabase_plan: "sin definir",
  r2_plan_mode: "sin definir",
  email_provider: "resend",
  usage_warning_threshold: 70,
  usage_danger_threshold: 85,
  email_daily_limit: null,
  email_monthly_limit: null,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value;
}

function asNullablePositiveInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const int = Math.trunc(value);
  return int > 0 ? int : null;
}

export function normalizeAdminPanelSettings(value: unknown): AdminPanelSettings {
  const input = asRecord(value);
  const warning = Math.max(
    50,
    Math.min(95, asNumber(input.usage_warning_threshold, defaultAdminPanelSettings.usage_warning_threshold)),
  );
  const danger = Math.max(
    warning + 1,
    Math.min(99, asNumber(input.usage_danger_threshold, defaultAdminPanelSettings.usage_danger_threshold)),
  );

  return {
    contact_notification_email: asString(
      input.contact_notification_email,
      defaultAdminPanelSettings.contact_notification_email,
    ),
    contact_notifications_enabled: asBoolean(
      input.contact_notifications_enabled,
      defaultAdminPanelSettings.contact_notifications_enabled,
    ),
    contact_auto_reply_enabled: asBoolean(
      input.contact_auto_reply_enabled,
      defaultAdminPanelSettings.contact_auto_reply_enabled,
    ),
    contact_auto_reply_subject: asString(
      input.contact_auto_reply_subject,
      defaultAdminPanelSettings.contact_auto_reply_subject,
    ),
    contact_auto_reply_body: asString(
      input.contact_auto_reply_body,
      defaultAdminPanelSettings.contact_auto_reply_body,
    ),
    alerts_enabled: asBoolean(input.alerts_enabled, defaultAdminPanelSettings.alerts_enabled),
    vercel_plan: asString(input.vercel_plan, defaultAdminPanelSettings.vercel_plan),
    supabase_plan: asString(input.supabase_plan, defaultAdminPanelSettings.supabase_plan),
    r2_plan_mode: asString(input.r2_plan_mode, defaultAdminPanelSettings.r2_plan_mode),
    email_provider: asString(input.email_provider, defaultAdminPanelSettings.email_provider),
    usage_warning_threshold: warning,
    usage_danger_threshold: danger,
    email_daily_limit: asNullablePositiveInt(input.email_daily_limit),
    email_monthly_limit: asNullablePositiveInt(input.email_monthly_limit),
  };
}

export async function getAdminPanelSettings(
  supabase: SupabaseClient<Database>,
): Promise<AdminPanelSettings> {
  const db = supabase as unknown as { from: (table: string) => any };

  const { data: panelSettings } = await db
    .from("admin_panel_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (panelSettings) {
    return normalizeAdminPanelSettings(panelSettings);
  }
  return normalizeAdminPanelSettings(undefined);
}
