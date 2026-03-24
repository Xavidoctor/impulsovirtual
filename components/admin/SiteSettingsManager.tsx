"use client";

import { useState } from "react";

import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { IMAGE_ACCEPT, normalizeUploadError, uploadAssetToLibrary } from "@/src/lib/admin/media-client";
import type { AdminPanelSettingsEntity, SiteSettingsEntity } from "@/src/types/entities";
import type { Tables } from "@/src/types/database.types";

type SiteFormState = {
  business_name: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_url: string;
  location: string;
  linkedin_url: string;
  instagram_url: string;
  behance_url: string;
  default_seo_title: string;
  default_seo_description: string;
  default_og_image_url: string;
};

type AdminFormState = {
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
  email_daily_limit: string;
  email_monthly_limit: string;
};

function toSiteForm(settings: SiteSettingsEntity | null): SiteFormState {
  return {
    business_name: settings?.business_name ?? "Impulso Virtual",
    hero_title: settings?.hero_title ?? "",
    hero_subtitle: settings?.hero_subtitle ?? "",
    hero_cta_primary: settings?.hero_cta_primary ?? "",
    hero_cta_secondary: settings?.hero_cta_secondary ?? "",
    contact_email: settings?.contact_email ?? "",
    contact_phone: settings?.contact_phone ?? "",
    whatsapp_url: settings?.whatsapp_url ?? "",
    location: settings?.location ?? "",
    linkedin_url: settings?.linkedin_url ?? "",
    instagram_url: settings?.instagram_url ?? "",
    behance_url: settings?.behance_url ?? "",
    default_seo_title: settings?.default_seo_title ?? "",
    default_seo_description: settings?.default_seo_description ?? "",
    default_og_image_url: settings?.default_og_image_url ?? "",
  };
}

function toAdminForm(settings: AdminPanelSettingsEntity): AdminFormState {
  return {
    contact_notification_email: settings.contact_notification_email,
    contact_notifications_enabled: settings.contact_notifications_enabled,
    contact_auto_reply_enabled: settings.contact_auto_reply_enabled,
    contact_auto_reply_subject: settings.contact_auto_reply_subject,
    contact_auto_reply_body: settings.contact_auto_reply_body,
    alerts_enabled: settings.alerts_enabled,
    vercel_plan: settings.vercel_plan,
    supabase_plan: settings.supabase_plan,
    r2_plan_mode: settings.r2_plan_mode,
    email_provider: settings.email_provider,
    usage_warning_threshold: settings.usage_warning_threshold,
    usage_danger_threshold: settings.usage_danger_threshold,
    email_daily_limit: settings.email_daily_limit ? String(settings.email_daily_limit) : "",
    email_monthly_limit: settings.email_monthly_limit ? String(settings.email_monthly_limit) : "",
  };
}

type AssetRow = Tables<"cms_assets">;

export function SiteSettingsManager({
  initialSite,
  initialAdminPanel,
}: {
  initialSite: SiteSettingsEntity | null;
  initialAdminPanel: AdminPanelSettingsEntity;
}) {
  const [siteForm, setSiteForm] = useState<SiteFormState>(() => toSiteForm(initialSite));
  const [adminForm, setAdminForm] = useState<AdminFormState>(() => toAdminForm(initialAdminPanel));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshSettings() {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "No se pudieron recargar los ajustes.");
    setSiteForm(toSiteForm(payload.data?.site ?? null));
    setAdminForm(toAdminForm(payload.data?.admin_panel as AdminPanelSettingsEntity));
  }

  async function saveAll() {
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const body = {
        site: {
          ...siteForm,
          hero_title: siteForm.hero_title || null,
          hero_subtitle: siteForm.hero_subtitle || null,
          hero_cta_primary: siteForm.hero_cta_primary || null,
          hero_cta_secondary: siteForm.hero_cta_secondary || null,
          contact_email: siteForm.contact_email || null,
          contact_phone: siteForm.contact_phone || null,
          whatsapp_url: siteForm.whatsapp_url || null,
          location: siteForm.location || null,
          linkedin_url: siteForm.linkedin_url || null,
          instagram_url: siteForm.instagram_url || null,
          behance_url: siteForm.behance_url || null,
          default_seo_title: siteForm.default_seo_title || null,
          default_seo_description: siteForm.default_seo_description || null,
          default_og_image_url: siteForm.default_og_image_url || null,
        },
        admin_panel: {
          ...adminForm,
          email_daily_limit: adminForm.email_daily_limit ? Number(adminForm.email_daily_limit) : null,
          email_monthly_limit: adminForm.email_monthly_limit ? Number(adminForm.email_monthly_limit) : null,
        },
      };

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudieron guardar los ajustes.");
      await refreshSettings();
      setMessage("Ajustes guardados.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadOg(file: File) {
    setIsUploadingOg(true);
    setError("");
    setMessage("");
    try {
      const asset = await uploadAssetToLibrary({
        file,
        expectedKind: "image",
        scope: "brand",
        settingKey: "seo_global",
        folder: "brand",
      });
      setSiteForm((prev) => ({ ...prev, default_og_image_url: asset.public_url }));
      setMessage("Imagen OG subida. Recuerda guardar.");
    } catch (uploadError) {
      setError(
        normalizeUploadError(
          uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen OG.",
        ),
      );
    } finally {
      setIsUploadingOg(false);
    }
  }

  function applyLibraryAsset(items: AssetRow[]) {
    const asset = items[0];
    if (!asset) return;
    setSiteForm((prev) => ({ ...prev, default_og_image_url: asset.public_url }));
    setMessage("Imagen OG aplicada.");
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl tracking-wide">Ajustes</h1>
        <p className="text-sm text-neutral-400">
          Configura ajustes públicos del sitio y ajustes operativos del panel.
        </p>
      </div>

      <div className="space-y-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <h2 className="font-display text-2xl tracking-wide">Ajustes del sitio</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-neutral-300">Nombre del negocio</span>
            <input
              value={siteForm.business_name}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, business_name: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Título principal</span>
            <input
              value={siteForm.hero_title}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, hero_title: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Subtítulo principal</span>
            <input
              value={siteForm.hero_subtitle}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, hero_subtitle: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">CTA primaria</span>
            <input
              value={siteForm.hero_cta_primary}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, hero_cta_primary: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">CTA secundaria</span>
            <input
              value={siteForm.hero_cta_secondary}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, hero_cta_secondary: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Email</span>
            <input
              value={siteForm.contact_email}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, contact_email: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Teléfono</span>
            <input
              value={siteForm.contact_phone}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, contact_phone: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">WhatsApp URL</span>
            <input
              value={siteForm.whatsapp_url}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, whatsapp_url: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Ubicación</span>
            <input
              value={siteForm.location}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, location: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">LinkedIn</span>
            <input
              value={siteForm.linkedin_url}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, linkedin_url: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Instagram</span>
            <input
              value={siteForm.instagram_url}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, instagram_url: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Behance</span>
            <input
              value={siteForm.behance_url}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, behance_url: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Título SEO por defecto</span>
            <input
              value={siteForm.default_seo_title}
              onChange={(event) => setSiteForm((prev) => ({ ...prev, default_seo_title: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Descripción SEO por defecto</span>
            <input
              value={siteForm.default_seo_description}
              onChange={(event) =>
                setSiteForm((prev) => ({ ...prev, default_seo_description: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-neutral-300">URL de imagen OG por defecto</span>
            <input
              value={siteForm.default_og_image_url}
              onChange={(event) =>
                setSiteForm((prev) => ({ ...prev, default_og_image_url: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10">
                {isUploadingOg ? "Subiendo..." : "Subir OG"}
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadOg(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10"
              >
                Biblioteca
              </button>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <h2 className="font-display text-2xl tracking-wide">Ajustes del panel de administración</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Email de notificaciones</span>
            <input
              value={adminForm.contact_notification_email}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, contact_notification_email: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Proveedor de email</span>
            <input
              value={adminForm.email_provider}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, email_provider: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-neutral-300">Asunto de respuesta automática</span>
            <input
              value={adminForm.contact_auto_reply_subject}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, contact_auto_reply_subject: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-neutral-300">Cuerpo de respuesta automática</span>
            <textarea
              rows={4}
              value={adminForm.contact_auto_reply_body}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, contact_auto_reply_body: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Plan Vercel</span>
            <input
              value={adminForm.vercel_plan}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, vercel_plan: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Plan Supabase</span>
            <input
              value={adminForm.supabase_plan}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, supabase_plan: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Plan R2</span>
            <input
              value={adminForm.r2_plan_mode}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, r2_plan_mode: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Umbral de aviso (%)</span>
            <input
              type="number"
              value={adminForm.usage_warning_threshold}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, usage_warning_threshold: Number(event.target.value || 70) }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Umbral crítico (%)</span>
            <input
              type="number"
              value={adminForm.usage_danger_threshold}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, usage_danger_threshold: Number(event.target.value || 85) }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Límite diario emails</span>
            <input
              type="number"
              value={adminForm.email_daily_limit}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, email_daily_limit: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Límite mensual emails</span>
            <input
              type="number"
              value={adminForm.email_monthly_limit}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, email_monthly_limit: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={adminForm.contact_notifications_enabled}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, contact_notifications_enabled: event.target.checked }))
              }
            />
            Notificaciones de contacto
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={adminForm.contact_auto_reply_enabled}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, contact_auto_reply_enabled: event.target.checked }))
              }
            />
            Respuesta automática activada
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={adminForm.alerts_enabled}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, alerts_enabled: event.target.checked }))}
            />
            Alertas activadas
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={isSaving}
          className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
        >
          {isSaving ? "Guardando..." : "Guardar ajustes"}
        </button>
        <button
          type="button"
          onClick={() => void refreshSettings()}
          className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
        >
          Recargar
        </button>
        {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
        {error ? <span className="text-sm text-red-300">{error}</span> : null}
      </div>

      <MediaLibraryPicker
        abierto={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={applyLibraryAsset}
        tipoPermitido="image"
        textoConfirmar="Usar imagen"
      />
    </section>
  );
}
