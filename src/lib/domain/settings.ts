import "server-only";

import type { AdminPanelSettingsEntity, SiteSettingsEntity } from "@/src/types/entities";
import type { Tables, TablesInsert } from "@/src/types/database.types";

import {
  defaultAdminPanelSettings,
  normalizeAdminPanelSettings,
} from "@/src/lib/cms/admin-panel-settings";
import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type SiteSettingsRow = Tables<"site_settings">;
type UpsertSiteSettingsInput = Omit<TablesInsert<"site_settings">, "id" | "updated_at">;
type AdminPanelSettingsRow = Tables<"admin_panel_settings">;
type UpsertAdminPanelSettingsInput = Omit<
  TablesInsert<"admin_panel_settings">,
  "id" | "updated_at"
>;

function mapSiteSettingsRow(row: SiteSettingsRow): SiteSettingsEntity {
  return {
    id: row.id,
    business_name: row.business_name,
    hero_title: row.hero_title,
    hero_subtitle: row.hero_subtitle,
    hero_cta_primary: row.hero_cta_primary,
    hero_cta_secondary: row.hero_cta_secondary,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    whatsapp_url: row.whatsapp_url,
    location: row.location,
    linkedin_url: row.linkedin_url,
    instagram_url: row.instagram_url,
    behance_url: row.behance_url,
    default_seo_title: row.default_seo_title,
    default_seo_description: row.default_seo_description,
    default_og_image_url: row.default_og_image_url,
    updated_at: row.updated_at,
  };
}

function mapAdminPanelSettingsRow(
  row: AdminPanelSettingsRow,
): AdminPanelSettingsEntity {
  const normalized = normalizeAdminPanelSettings(row);
  return {
    id: row.id,
    contact_notification_email: normalized.contact_notification_email,
    contact_notifications_enabled: normalized.contact_notifications_enabled,
    contact_auto_reply_enabled: normalized.contact_auto_reply_enabled,
    contact_auto_reply_subject: normalized.contact_auto_reply_subject,
    contact_auto_reply_body: normalized.contact_auto_reply_body,
    alerts_enabled: normalized.alerts_enabled,
    vercel_plan: normalized.vercel_plan,
    supabase_plan: normalized.supabase_plan,
    r2_plan_mode: normalized.r2_plan_mode,
    email_provider: normalized.email_provider,
    usage_warning_threshold: normalized.usage_warning_threshold,
    usage_danger_threshold: normalized.usage_danger_threshold,
    email_daily_limit: normalized.email_daily_limit,
    email_monthly_limit: normalized.email_monthly_limit,
    updated_at: row.updated_at,
  };
}

export async function getSiteSettings(supabase?: DomainSupabaseClient): Promise<SiteSettingsEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapSiteSettingsRow(data);
}

export async function upsertSiteSettings(
  input: UpsertSiteSettingsInput,
  supabase?: DomainSupabaseClient,
): Promise<SiteSettingsEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;
  const current = await getSiteSettings(db);

  if (current) {
    const { data, error } = await db
      .from("site_settings")
      .update(input)
      .eq("id", current.id)
      .select("*")
      .single();
    if (error || !data) return null;
    return mapSiteSettingsRow(data);
  }

  const { data, error } = await db.from("site_settings").insert(input).select("*").single();
  if (error || !data) return null;
  return mapSiteSettingsRow(data);
}

export async function getAdminPanelSettings(
  supabase?: DomainSupabaseClient,
): Promise<AdminPanelSettingsEntity> {
  const db = getOptionalDomainClient(supabase);
  if (!db) {
    return {
      id: "default",
      ...defaultAdminPanelSettings,
      updated_at: new Date(0).toISOString(),
    };
  }

  const { data, error } = await db
    .from("admin_panel_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      id: "default",
      ...defaultAdminPanelSettings,
      updated_at: new Date(0).toISOString(),
    };
  }

  return mapAdminPanelSettingsRow(data);
}

export async function upsertAdminPanelSettings(
  input: UpsertAdminPanelSettingsInput,
  supabase?: DomainSupabaseClient,
): Promise<AdminPanelSettingsEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const current = await getAdminPanelSettings(db);
  const hasRow = current.id !== "default";

  if (hasRow) {
    const { data, error } = await db
      .from("admin_panel_settings")
      .update(input)
      .eq("id", current.id)
      .select("*")
      .single();

    if (error || !data) return null;
    return mapAdminPanelSettingsRow(data);
  }

  const { data, error } = await db
    .from("admin_panel_settings")
    .insert(input)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapAdminPanelSettingsRow(data);
}
