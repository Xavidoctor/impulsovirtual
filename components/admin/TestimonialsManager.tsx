"use client";

import { useMemo, useState } from "react";

import { IMAGE_ACCEPT, normalizeUploadError, uploadAssetToLibrary } from "@/src/lib/admin/media-client";
import type { TestimonialEntity } from "@/src/types/entities";

type FormState = {
  id: string | null;
  name: string;
  company: string;
  role: string;
  quote: string;
  avatar_url: string;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
};

function toForm(item?: TestimonialEntity | null): FormState {
  return {
    id: item?.id ?? null,
    name: item?.name ?? "",
    company: item?.company ?? "",
    role: item?.role ?? "",
    quote: item?.quote ?? "",
    avatar_url: item?.avatar_url ?? "",
    sort_order: item?.sort_order ?? 0,
    is_featured: Boolean(item?.is_featured),
    is_published: Boolean(item?.is_published),
  };
}

export function TestimonialsManager({ initialItems }: { initialItems: TestimonialEntity[] }) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [form, setForm] = useState<FormState>(() => toForm(initialItems[0] ?? null));
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    if (!term) return sorted;
    return sorted.filter((item) =>
      `${item.name} ${item.company ?? ""} ${item.role ?? ""} ${item.quote}`
        .toLowerCase()
        .includes(term),
    );
  }, [items, search]);

  function selectItem(item: TestimonialEntity | null) {
    setSelectedId(item?.id ?? null);
    setForm(toForm(item));
    setMessage("");
    setError("");
  }

  async function refreshItems() {
    const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "No se pudieron recargar los testimonios.");
    const next = (payload.data ?? []) as TestimonialEntity[];
    setItems(next);
    if (selectedId) {
      const current = next.find((item) => item.id === selectedId) ?? null;
      setForm(toForm(current));
    }
  }

  async function saveItem() {
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const body = {
        id: form.id ?? undefined,
        name: form.name,
        company: form.company || null,
        role: form.role || null,
        quote: form.quote,
        avatar_url: form.avatar_url || null,
        sort_order: Number(form.sort_order || 0),
        is_featured: form.is_featured,
        is_published: form.is_published,
      };
      const response = await fetch("/api/admin/testimonials", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar.");
      await refreshItems();
      const saved = payload.data as TestimonialEntity;
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage(form.id ? "Testimonio actualizado." : "Testimonio creado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem() {
    if (!form.id) return;
    if (!confirm("¿Eliminar este testimonio?")) return;

    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo eliminar.");
      const remaining = items.filter((item) => item.id !== form.id);
      setItems(remaining);
      selectItem(remaining[0] ?? null);
      setMessage("Testimonio eliminado.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setIsUploading(true);
    setError("");
    setMessage("");
    try {
      const asset = await uploadAssetToLibrary({
        file,
        expectedKind: "image",
        scope: "site",
        folder: "testimonials",
      });
      setForm((prev) => ({ ...prev, avatar_url: asset.public_url }));
      setMessage("Avatar subido. Recuerda guardar.");
    } catch (uploadError) {
      setError(
        normalizeUploadError(
          uploadError instanceof Error ? uploadError.message : "No se pudo subir el avatar.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl tracking-wide">Testimonios</h1>
        <p className="text-sm text-neutral-400">Gestiona testimonios, orden y publicación.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <aside className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="w-full space-y-1 text-sm">
              <span className="text-neutral-300">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={() => selectItem(null)}
              className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-white/10"
            >
              Nuevo
            </button>
          </div>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item)}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  selectedId === item.id
                    ? "border-emerald-300/45 bg-emerald-500/10"
                    : "border-white/10 bg-black/25 hover:bg-white/5"
                }`}
              >
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="line-clamp-2 text-xs text-neutral-400">{item.quote}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="font-display text-2xl tracking-wide">
            {form.id ? "Editar testimonio" : "Nuevo testimonio"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Nombre</span>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Empresa</span>
              <input
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Cargo</span>
              <input
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
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
              <span className="text-neutral-300">Avatar URL</span>
              <input
                value={form.avatar_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, avatar_url: event.target.value }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
              <label className="inline-flex cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10">
                {isUploading ? "Subiendo..." : "Subir avatar"}
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadAvatar(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Cita</span>
              <textarea
                rows={4}
                value={form.quote}
                onChange={(event) => setForm((prev) => ({ ...prev, quote: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_featured: event.target.checked }))
                }
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
              onClick={() => void saveItem()}
              disabled={isSaving}
              className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => void deleteItem()}
                disabled={isSaving}
                className="rounded-md border border-red-400/30 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void refreshItems()}
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
            >
              Recargar
            </button>
            {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
            {error ? <span className="text-sm text-red-300">{error}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
