"use client";

import { useMemo, useState } from "react";

import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { IMAGE_ACCEPT, normalizeUploadError, uploadAssetToLibrary } from "@/src/lib/admin/media-client";
import { slugify } from "@/src/lib/admin/slugify";
import type { ServiceEntity } from "@/src/types/entities";
import type { Tables } from "@/src/types/database.types";

type ServiceFormState = {
  id: string | null;
  slug: string;
  title: string;
  subtitle: string;
  short_description: string;
  full_description: string;
  cover_image_url: string;
  icon_name: string;
  featured: boolean;
  sort_order: number;
  is_published: boolean;
  seo_title: string;
  seo_description: string;
};

function toFormState(service?: ServiceEntity | null): ServiceFormState {
  return {
    id: service?.id ?? null,
    slug: service?.slug ?? "",
    title: service?.title ?? "",
    subtitle: service?.subtitle ?? "",
    short_description: service?.short_description ?? "",
    full_description: service?.full_description ?? "",
    cover_image_url: service?.cover_image_url ?? "",
    icon_name: service?.icon_name ?? "",
    featured: Boolean(service?.featured),
    sort_order: service?.sort_order ?? 0,
    is_published: Boolean(service?.is_published),
    seo_title: service?.seo_title ?? "",
    seo_description: service?.seo_description ?? "",
  };
}

type AssetRow = Tables<"cms_assets">;

export function ServicesManager({ initialServices }: { initialServices: ServiceEntity[] }) {
  const [services, setServices] = useState(initialServices);
  const [selectedId, setSelectedId] = useState<string | null>(initialServices[0]?.id ?? null);
  const [form, setForm] = useState<ServiceFormState>(() => toFormState(initialServices[0] ?? null));
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...services].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.title.localeCompare(b.title, "es");
    });
    if (!term) return sorted;

    return sorted.filter((item) =>
      `${item.title} ${item.slug} ${item.short_description} ${item.subtitle ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [services, search]);

  function selectService(service: ServiceEntity | null) {
    setSelectedId(service?.id ?? null);
    setForm(toFormState(service));
    setMessage("");
    setError("");
  }

  async function refreshServices() {
    const response = await fetch("/api/admin/services", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudieron recargar los servicios.");
    }
    const next: ServiceEntity[] = payload.data ?? [];
    setServices(next);

    if (selectedId) {
      const current = next.find((item) => item.id === selectedId) ?? null;
      setForm(toFormState(current));
    }
  }

  async function saveService() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const body = {
        id: form.id ?? undefined,
        slug: slugify(form.slug || form.title),
        title: form.title,
        subtitle: form.subtitle || null,
        short_description: form.short_description,
        full_description: form.full_description,
        cover_image_url: form.cover_image_url || null,
        icon_name: form.icon_name || null,
        featured: form.featured,
        sort_order: Number(form.sort_order || 0),
        is_published: form.is_published,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      };

      const response = await fetch("/api/admin/services", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar el servicio.");
      }

      const saved = payload.data as ServiceEntity;
      setSelectedId(saved.id);
      setForm(toFormState(saved));
      await refreshServices();
      setMessage(form.id ? "Servicio actualizado." : "Servicio creado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCurrentService() {
    if (!form.id) return;
    if (!confirm("¿Eliminar este servicio? Esta acción no se puede deshacer.")) return;

    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el servicio.");
      }

      const remaining = services.filter((item) => item.id !== form.id);
      setServices(remaining);
      selectService(remaining[0] ?? null);
      setMessage("Servicio eliminado.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadCover(file: File) {
    setIsUploading(true);
    setError("");
    setMessage("");
    try {
      const asset = await uploadAssetToLibrary({
        file,
        expectedKind: "image",
        scope: "site",
        folder: "services",
      });
      setForm((prev) => ({ ...prev, cover_image_url: asset.public_url }));
      setMessage("Imagen subida. Recuerda guardar el servicio.");
    } catch (uploadError) {
      setError(
        normalizeUploadError(
          uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleAssetPick(items: AssetRow[]) {
    const asset = items[0];
    if (!asset) return;
    setForm((prev) => ({ ...prev, cover_image_url: asset.public_url }));
    setMessage("Imagen aplicada desde biblioteca.");
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl tracking-wide">Servicios</h1>
        <p className="text-sm text-neutral-400">
          Gestiona servicios, orden, destacados y SEO sin tocar código.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <aside className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="w-full space-y-1 text-sm">
              <span className="text-neutral-300">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Título o slug"
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={() => selectService(null)}
              className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-white/10"
            >
              Nuevo
            </button>
          </div>

          <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {filteredServices.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectService(item)}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  selectedId === item.id
                    ? "border-emerald-300/45 bg-emerald-500/10"
                    : "border-white/10 bg-black/25 hover:bg-white/5"
                }`}
              >
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-neutral-400">/{item.slug}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-neutral-300">
                    Orden {item.sort_order}
                  </span>
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-neutral-300">
                    {item.is_published ? "Publicado" : "Borrador"}
                  </span>
                  {item.featured ? (
                    <span className="rounded-full border border-emerald-300/35 px-2 py-0.5 text-emerald-200">
                      Destacado
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
            {!filteredServices.length ? (
              <p className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-neutral-400">
                No hay servicios para este filtro.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="font-display text-2xl tracking-wide">
            {form.id ? "Editar servicio" : "Nuevo servicio"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Título</span>
              <input
                value={form.title}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => ({ ...prev, title: value, slug: prev.slug || slugify(value) }));
                }}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Subtítulo</span>
              <input
                value={form.subtitle}
                onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Descripción corta</span>
              <textarea
                rows={2}
                value={form.short_description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, short_description: event.target.value }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Descripción completa</span>
              <textarea
                rows={7}
                value={form.full_description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, full_description: event.target.value }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">URL de imagen de portada</span>
              <input
                value={form.cover_image_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cover_image_url: event.target.value }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10">
                  {isUploading ? "Subiendo..." : "Subir imagen"}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadCover(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10"
                >
                  Usar biblioteca
                </button>
              </div>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Icono</span>
              <input
                value={form.icon_name}
                onChange={(event) => setForm((prev) => ({ ...prev, icon_name: event.target.value }))}
                placeholder="sparkles, chart, ..."
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Orden</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Título SEO</span>
              <input
                value={form.seo_title}
                onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Descripción SEO</span>
              <textarea
                rows={2}
                value={form.seo_description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, seo_description: event.target.value }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 text-neutral-300">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_published: event.target.checked }))
                }
              />
              Publicado
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => void saveService()}
              disabled={isSaving}
              className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => void deleteCurrentService()}
                disabled={isSaving}
                className="rounded-md border border-red-400/30 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void refreshServices()}
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
            >
              Recargar
            </button>
            {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
            {error ? <span className="text-sm text-red-300">{error}</span> : null}
          </div>
        </div>
      </div>

      <MediaLibraryPicker
        abierto={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleAssetPick}
        tipoPermitido="image"
        textoConfirmar="Usar imagen"
      />
    </section>
  );
}
