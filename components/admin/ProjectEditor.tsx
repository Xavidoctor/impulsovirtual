"use client";

import Link from "next/link";
import { useState } from "react";

import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { ProjectMediaManager } from "@/components/admin/ProjectMediaManager";
import { IMAGE_ACCEPT, normalizeUploadError, uploadAssetToLibrary } from "@/src/lib/admin/media-client";
import { slugify } from "@/src/lib/admin/slugify";
import type { ProjectEntity, ProjectStatus } from "@/src/types/entities";
import type { Tables } from "@/src/types/database.types";

type ProjectMediaRow = Tables<"project_media">;
type AssetRow = Tables<"cms_assets">;

type ProjectEditorProps = {
  projectId: string;
  initialProject: ProjectEntity;
  initialMedia: ProjectMediaRow[];
};

type FormState = {
  title: string;
  slug: string;
  client_name: string;
  excerpt: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  cover_image_url: string;
  company_logo_url: string;
  live_url: string;
  project_orientation: string;
  what_was_done: string;
  services_applied: string;
  preview_mode: "embed" | "image" | "external_only";
  preview_image_url: string;
  featured: boolean;
  status: ProjectStatus;
  progress_percentage: string;
  progress_label: string;
  progress_note: string;
  is_published: boolean;
  published_at: string;
  seo_title: string;
  seo_description: string;
};

function toForm(project: ProjectEntity): FormState {
  return {
    title: project.title,
    slug: project.slug,
    client_name: project.client_name ?? "",
    excerpt: project.excerpt ?? "",
    description: project.description ?? "",
    challenge: project.challenge ?? "",
    solution: project.solution ?? "",
    results: project.results ?? "",
    cover_image_url: project.cover_image_url ?? "",
    company_logo_url: project.company_logo_url ?? "",
    live_url: project.live_url ?? project.website_url ?? "",
    project_orientation: project.project_orientation ?? "",
    what_was_done: project.what_was_done ?? "",
    services_applied: project.services_applied.join(", "),
    preview_mode: project.preview_mode,
    preview_image_url: project.preview_image_url ?? "",
    featured: project.featured,
    status: project.status,
    progress_percentage:
      project.progress_percentage !== null ? String(project.progress_percentage) : "",
    progress_label: project.progress_label ?? "",
    progress_note: project.progress_note ?? "",
    is_published: project.is_published,
    published_at: project.published_at ? project.published_at.slice(0, 16) : "",
    seo_title: project.seo_title ?? "",
    seo_description: project.seo_description ?? "",
  };
}

export function ProjectEditor({ projectId, initialProject, initialMedia }: ProjectEditorProps) {
  const [project, setProject] = useState(initialProject);
  const [form, setForm] = useState<FormState>(() => toForm(initialProject));
  const [mediaRows, setMediaRows] = useState(initialMedia);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"cover" | "logo" | "preview" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshProject() {
    const response = await fetch(`/api/admin/projects?id=${projectId}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudo recargar el proyecto.");
    }

    setProject(payload.data);
    setForm(toForm(payload.data));
    setMediaRows(payload.media ?? []);
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          slug: slugify(form.slug || form.title),
          title: form.title,
          client_name: form.client_name || null,
          excerpt: form.excerpt || null,
          description: form.description || null,
          challenge: form.challenge || null,
          solution: form.solution || null,
          results: form.results || null,
          cover_image_url: form.cover_image_url || null,
          company_logo_url: form.company_logo_url || null,
          live_url: form.live_url || null,
          website_url: form.live_url || null,
          project_orientation: form.project_orientation || null,
          what_was_done: form.what_was_done || null,
          services_applied: form.services_applied
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          preview_mode: form.preview_mode,
          preview_image_url: form.preview_image_url || null,
          featured: form.featured,
          status: form.status,
          progress_percentage:
            form.status === "in_progress" && form.progress_percentage.trim()
              ? Number(form.progress_percentage)
              : null,
          progress_label: form.status === "in_progress" ? form.progress_label || null : null,
          progress_note: form.status === "in_progress" ? form.progress_note || null : null,
          is_published: form.is_published,
          published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar el proyecto.");
      }

      setProject(payload.data);
      setForm(toForm(payload.data));
      setMessage("Proyecto guardado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadCover(file: File) {
    setIsUploadingCover(true);
    setMessage("");
    setError("");
    try {
      const asset = await uploadAssetToLibrary({
        file,
        expectedKind: "image",
        scope: "project",
        folder: form.slug || "project",
      });
      setForm((prev) => ({ ...prev, cover_image_url: asset.public_url }));
      setMessage("Portada subida. Recuerda guardar.");
    } catch (uploadError) {
      setError(
        normalizeUploadError(
          uploadError instanceof Error ? uploadError.message : "No se pudo subir la portada.",
        ),
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function uploadLogo(file: File) {
    setIsUploadingLogo(true);
    setMessage("");
    setError("");
    try {
      const asset = await uploadAssetToLibrary({
        file,
        expectedKind: "image",
        scope: "project",
        folder: `${form.slug || "project"}/logo`,
      });
      setForm((prev) => ({ ...prev, company_logo_url: asset.public_url }));
      setMessage("Logo subido. Recuerda guardar.");
    } catch (uploadError) {
      setError(
        normalizeUploadError(
          uploadError instanceof Error ? uploadError.message : "No se pudo subir el logo.",
        ),
      );
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function applyLibraryAsset(items: AssetRow[]) {
    const asset = items[0];
    if (!asset) return;
    if (pickerTarget === "preview") {
      setForm((prev) => ({ ...prev, preview_image_url: asset.public_url }));
      setMessage("Imagen fallback aplicada desde biblioteca.");
    } else if (pickerTarget === "logo") {
      setForm((prev) => ({ ...prev, company_logo_url: asset.public_url }));
      setMessage("Logo aplicado desde biblioteca.");
    } else {
      setForm((prev) => ({ ...prev, cover_image_url: asset.public_url }));
      setMessage("Portada aplicada desde biblioteca.");
    }
    setPickerTarget(null);
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl tracking-wide">{project.title}</h1>
          <p className="text-sm text-neutral-400">
            /{project.slug} · {project.is_published ? "Publicado" : "Borrador"} · {project.status === "completed" ? "Completado" : "En desarrollo"}
          </p>
        </div>
        <Link
          href="/admin/projects"
          className="rounded-md border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.12em] text-neutral-200 transition-colors hover:bg-white/10"
        >
          Volver
        </Link>
      </div>

      <form onSubmit={saveProject} className="space-y-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-wide">General</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
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
              <span className="text-neutral-300">Cliente</span>
              <input
                value={form.client_name}
                onChange={(event) => setForm((prev) => ({ ...prev, client_name: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">URL real del proyecto</span>
              <input
                value={form.live_url}
                onChange={(event) => setForm((prev) => ({ ...prev, live_url: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
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
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Estado de proyecto</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as ProjectStatus,
                    progress_percentage:
                      event.target.value === "in_progress" ? prev.progress_percentage : "",
                    progress_label:
                      event.target.value === "in_progress" ? prev.progress_label : "",
                    progress_note: event.target.value === "in_progress" ? prev.progress_note : "",
                  }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              >
                <option value="completed">Completado</option>
                <option value="in_progress">En desarrollo</option>
              </select>
            </label>
            {form.status === "in_progress" ? (
              <>
                <label className="space-y-1 text-sm">
                  <span className="text-neutral-300">Progreso (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress_percentage}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, progress_percentage: event.target.value }))
                    }
                    className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-neutral-300">Etiqueta de progreso</span>
                  <input
                    value={form.progress_label}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, progress_label: event.target.value }))
                    }
                    placeholder="Ej: Fase final de implementación"
                    className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-neutral-300">Nota de estado</span>
                  <input
                    value={form.progress_note}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, progress_note: event.target.value }))
                    }
                    placeholder="Ej: Ajustes finales de QA y contenidos."
                    className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                  />
                </label>
              </>
            ) : null}
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Extracto</span>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Portada URL</span>
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
                      if (file) void uploadCover(file);
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
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-neutral-300">Logo de empresa (PNG sin fondo recomendado)</span>
              <input
                value={form.company_logo_url}
                onChange={(event) => setForm((prev) => ({ ...prev, company_logo_url: event.target.value }))}
                placeholder="URL del logo para cards de proyecto"
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10">
                  {isUploadingLogo ? "Subiendo..." : "Subir logo"}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadLogo(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPickerTarget("logo")}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10"
                >
                  Biblioteca
                </button>
              </div>
              {form.company_logo_url ? (
                <div className="rounded-md border border-white/10 bg-black/30 p-3">
                  <img
                    src={form.company_logo_url}
                    alt="Vista previa logo de empresa"
                    className="h-10 w-auto max-w-full object-contain"
                  />
                </div>
              ) : null}
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Modo de preview</span>
              <select
                value={form.preview_mode}
                onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      preview_mode: event.target.value as "embed" | "image" | "external_only",
                    }))
                }
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              >
                <option value="embed">Intentar iframe</option>
                <option value="image">Solo imagen fallback</option>
                <option value="external_only">Solo externo (botón + fallback)</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Imagen fallback del preview</span>
              <input
                value={form.preview_image_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, preview_image_url: event.target.value }))
                }
                placeholder="/og-cover.svg o URL completa"
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setPickerTarget("preview")}
                className="w-fit rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10"
              >
                Biblioteca
              </button>
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
                onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))}
              />
              Publicado
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="font-display text-2xl tracking-wide">Caso</h2>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Orientación del proyecto</span>
            <input
              value={form.project_orientation}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, project_orientation: event.target.value }))
              }
              placeholder="Ej: Ecommerce premium"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Descripción</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Qué se ha hecho</span>
            <textarea
              rows={4}
              value={form.what_was_done}
              onChange={(event) => setForm((prev) => ({ ...prev, what_was_done: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Servicios aplicados (separados por coma)</span>
            <input
              value={form.services_applied}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, services_applied: event.target.value }))
              }
              placeholder="Estrategia digital, Diseño web premium, UX/UI"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Challenge</span>
            <textarea
              rows={4}
              value={form.challenge}
              onChange={(event) => setForm((prev) => ({ ...prev, challenge: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Solution</span>
            <textarea
              rows={4}
              value={form.solution}
              onChange={(event) => setForm((prev) => ({ ...prev, solution: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Results</span>
            <textarea
              rows={4}
              value={form.results}
              onChange={(event) => setForm((prev) => ({ ...prev, results: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="font-display text-2xl tracking-wide">SEO</h2>
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
          >
            {isSaving ? "Guardando..." : "Guardar proyecto"}
          </button>
          {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
          {error ? <span className="text-sm text-red-300">{error}</span> : null}
        </div>
      </form>

      <ProjectMediaManager projectId={projectId} initialMedia={mediaRows} onRefreshProject={refreshProject} />

      <MediaLibraryPicker
        abierto={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onConfirm={applyLibraryAsset}
        tipoPermitido="image"
        textoConfirmar={
          pickerTarget === "preview"
            ? "Usar fallback"
            : pickerTarget === "logo"
              ? "Usar logo"
              : "Usar portada"
        }
      />
    </section>
  );
}
