"use client";

import { useMemo, useState } from "react";

import { slugify } from "@/src/lib/admin/slugify";
import type { BlogCategoryEntity } from "@/src/types/entities";

type CategoryFormState = {
  id: string | null;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  is_published: boolean;
};

function toCategoryForm(item?: BlogCategoryEntity | null): CategoryFormState {
  return {
    id: item?.id ?? null,
    slug: item?.slug ?? "",
    name: item?.name ?? "",
    description: item?.description ?? "",
    sort_order: item?.sort_order ?? 0,
    is_published: item?.is_published ?? true,
  };
}

export function BlogCategoriesManager({
  initialItems,
}: {
  initialItems: BlogCategoryEntity[];
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [form, setForm] = useState<CategoryFormState>(() => toCategoryForm(initialItems[0] ?? null));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    if (!term) return sorted;
    return sorted.filter((item) =>
      `${item.name} ${item.slug} ${item.description ?? ""}`.toLowerCase().includes(term),
    );
  }, [items, search]);

  function selectItem(item: BlogCategoryEntity | null) {
    setSelectedId(item?.id ?? null);
    setForm(toCategoryForm(item));
    setMessage("");
    setError("");
  }

  async function refreshItems() {
    const response = await fetch("/api/admin/blog/categories", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "No se pudieron recargar categorías.");
    const next = (payload.data ?? []) as BlogCategoryEntity[];
    setItems(next);
    if (selectedId) {
      setForm(toCategoryForm(next.find((item) => item.id === selectedId) ?? null));
    }
  }

  async function saveItem() {
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const body = {
        id: form.id ?? undefined,
        slug: slugify(form.slug || form.name),
        name: form.name,
        description: form.description || null,
        sort_order: Number(form.sort_order || 0),
        is_published: form.is_published,
      };
      const response = await fetch("/api/admin/blog/categories", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar la categoría.");

      await refreshItems();
      const saved = payload.data as BlogCategoryEntity;
      setSelectedId(saved.id);
      setForm(toCategoryForm(saved));
      setMessage(form.id ? "Categoría actualizada." : "Categoría creada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem() {
    if (!form.id) return;
    if (!confirm("¿Eliminar esta categoría?")) return;

    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/blog/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo eliminar.");

      const remaining = items.filter((item) => item.id !== form.id);
      setItems(remaining);
      selectItem(remaining[0] ?? null);
      setMessage("Categoría eliminada.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl tracking-wide">Blog · Categorías</h1>
        <p className="text-sm text-neutral-400">Gestiona las categorías del blog.</p>
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
              Nueva
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
                <p className="text-xs text-neutral-400">/{item.slug}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="font-display text-2xl tracking-wide">
            {form.id ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <div className="grid gap-4">
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Nombre</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                    slug: prev.slug || slugify(event.target.value),
                  }))
                }
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
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Descripción</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Sort order</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))}
              />
              Publicada
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
