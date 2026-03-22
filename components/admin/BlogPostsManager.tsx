"use client";

import { useMemo, useState } from "react";

import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { IMAGE_ACCEPT, normalizeUploadError, uploadAssetToLibrary } from "@/src/lib/admin/media-client";
import { slugify } from "@/src/lib/admin/slugify";
import type { BlogCategoryEntity, BlogPostEntity } from "@/src/types/entities";
import type { Tables } from "@/src/types/database.types";

type BlogPostWithCategory = BlogPostEntity & {
  category: BlogCategoryEntity | null;
};

type FormState = {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category_id: string;
  author_name: string;
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
};

type AssetRow = Tables<"cms_assets">;

function toForm(item?: BlogPostWithCategory | null): FormState {
  return {
    id: item?.id ?? null,
    slug: item?.slug ?? "",
    title: item?.title ?? "",
    excerpt: item?.excerpt ?? "",
    content: item?.content ?? "",
    cover_image_url: item?.cover_image_url ?? "",
    category_id: item?.category_id ?? "",
    author_name: item?.author_name ?? "",
    is_featured: Boolean(item?.is_featured),
    is_published: Boolean(item?.is_published),
    published_at: item?.published_at ? item.published_at.slice(0, 16) : "",
    seo_title: item?.seo_title ?? "",
    seo_description: item?.seo_description ?? "",
    og_image_url: item?.og_image_url ?? "",
  };
}

export function BlogPostsManager({
  initialPosts,
  categories,
}: {
  initialPosts: BlogPostWithCategory[];
  categories: BlogCategoryEntity[];
}) {
  const [items, setItems] = useState(initialPosts);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialPosts[0]?.id ?? null);
  const [form, setForm] = useState<FormState>(() => toForm(initialPosts[0] ?? null));
  const [pickerTarget, setPickerTarget] = useState<"cover" | "og" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => {
      const aDate = a.published_at ?? a.created_at;
      const bDate = b.published_at ?? b.created_at;
      return bDate.localeCompare(aDate);
    });
    if (!term) return sorted;
    return sorted.filter((item) =>
      `${item.title} ${item.slug} ${item.excerpt} ${item.author_name ?? ""} ${item.category?.name ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [items, search]);

  function selectItem(item: BlogPostWithCategory | null) {
    setSelectedId(item?.id ?? null);
    setForm(toForm(item));
    setMessage("");
    setError("");
  }

  async function refreshItems() {
    const response = await fetch("/api/admin/blog/posts", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "No se pudieron recargar los posts.");
    const next = (payload.data ?? []) as BlogPostWithCategory[];
    setItems(next);
    if (selectedId) {
      setForm(toForm(next.find((item) => item.id === selectedId) ?? null));
    }
  }

  async function saveItem() {
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const body = {
        id: form.id ?? undefined,
        slug: slugify(form.slug || form.title),
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        category_id: form.category_id || null,
        author_name: form.author_name || null,
        is_featured: form.is_featured,
        is_published: form.is_published,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        og_image_url: form.og_image_url || null,
      };
      const response = await fetch("/api/admin/blog/posts", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar el post.");

      await refreshItems();
      const saved = payload.data as BlogPostEntity;
      setSelectedId(saved.id);
      setForm(toForm((payload.data as BlogPostWithCategory) ?? null));
      setMessage(form.id ? "Post actualizado." : "Post creado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem() {
    if (!form.id) return;
    if (!confirm("¿Eliminar este post?")) return;

    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/blog/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo eliminar.");

      const remaining = items.filter((item) => item.id !== form.id);
      setItems(remaining);
      selectItem(remaining[0] ?? null);
      setMessage("Post eliminado.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(target: "cover" | "og", file: File) {
    if (target === "cover") setIsUploadingCover(true);
    if (target === "og") setIsUploadingOg(true);
    setError("");
    setMessage("");
    try {
      const asset = await uploadAssetToLibrary({
        file,
        expectedKind: "image",
        scope: "blog",
        folder: form.slug || "posts",
      });
      if (target === "cover") {
        setForm((prev) => ({ ...prev, cover_image_url: asset.public_url }));
      } else {
        setForm((prev) => ({ ...prev, og_image_url: asset.public_url }));
      }
      setMessage("Imagen subida. Recuerda guardar.");
    } catch (uploadError) {
      setError(
        normalizeUploadError(
          uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.",
        ),
      );
    } finally {
      setIsUploadingCover(false);
      setIsUploadingOg(false);
    }
  }

  function applyLibraryAsset(items: AssetRow[]) {
    const asset = items[0];
    if (!asset || !pickerTarget) return;
    if (pickerTarget === "cover") {
      setForm((prev) => ({ ...prev, cover_image_url: asset.public_url }));
      setMessage("Portada aplicada.");
    } else {
      setForm((prev) => ({ ...prev, og_image_url: asset.public_url }));
      setMessage("Imagen OG aplicada.");
    }
    setPickerTarget(null);
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl tracking-wide">Blog · Posts</h1>
        <p className="text-sm text-neutral-400">Gestiona posts, publicación y SEO.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
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
                <p className="line-clamp-1 text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-neutral-400">/{item.slug}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="font-display text-2xl tracking-wide">
            {form.id ? "Editar post" : "Nuevo post"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Título</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    title: event.target.value,
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
              <span className="text-neutral-300">Autor</span>
              <input
                value={form.author_name}
                onChange={(event) => setForm((prev) => ({ ...prev, author_name: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Categoría</span>
              <select
                value={form.category_id}
                onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              >
                <option value="">Sin categoría</option>
                {categories
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Publicado en</span>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Excerpt</span>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Contenido</span>
              <textarea
                rows={10}
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Cover image URL</span>
              <input
                value={form.cover_image_url}
                onChange={(event) => setForm((prev) => ({ ...prev, cover_image_url: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10">
                  {isUploadingCover ? "Subiendo..." : "Subir portada"}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage("cover", file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPickerTarget("cover")}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10"
                >
                  Biblioteca
                </button>
              </div>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">SEO title</span>
              <input
                value={form.seo_title}
                onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">SEO description</span>
              <input
                value={form.seo_description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, seo_description: event.target.value }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">OG image URL</span>
              <input
                value={form.og_image_url}
                onChange={(event) => setForm((prev) => ({ ...prev, og_image_url: event.target.value }))}
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
                      if (file) void uploadImage("og", file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPickerTarget("og")}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10"
                >
                  Biblioteca
                </button>
              </div>
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => setForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))}
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

      <MediaLibraryPicker
        abierto={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onConfirm={applyLibraryAsset}
        tipoPermitido="image"
        textoConfirmar="Usar imagen"
      />
    </section>
  );
}
