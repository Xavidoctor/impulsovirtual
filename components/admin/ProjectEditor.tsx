"use client";

import Link from "next/link";
import { useState } from "react";

import type { Tables } from "@/src/types/database.types";

type ProjectRow = Tables<"projects">;
type ProjectMediaRow = Tables<"project_media">;

type ProjectEditorProps = {
  projectId: string;
  initialProject: ProjectRow;
  initialMedia: ProjectMediaRow[];
};

type ProjectFormState = {
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  bodyMarkdown: string;
  year: string;
  clientName: string;
  category: string;
  featured: boolean;
  status: "draft" | "published" | "archived";
  seoTitle: string;
  seoDescription: string;
  seoOgImage: string;
};

type ProjectStatus = "draft" | "published" | "archived";

function getStatusLabel(status: ProjectStatus) {
  if (status === "draft") return "Borrador";
  if (status === "published") return "Publicado";
  return "Archivado";
}

function getKindLabel(kind: "image" | "video") {
  return kind === "image" ? "Imagen" : "Vídeo";
}

function getRoleLabel(role: "cover" | "hero" | "gallery" | "detail") {
  if (role === "cover") return "Portada";
  if (role === "hero") return "Hero";
  if (role === "gallery") return "Galería";
  return "Detalle";
}

function toFormState(project: ProjectRow): ProjectFormState {
  const seo = (project.seo_json ?? {}) as {
    title?: string;
    description?: string;
    ogImage?: string;
  };

  return {
    title: project.title,
    slug: project.slug,
    subtitle: project.subtitle ?? "",
    excerpt: project.excerpt ?? "",
    bodyMarkdown: project.body_markdown ?? "",
    year: project.year ? String(project.year) : "",
    clientName: project.client_name ?? "",
    category: project.category ?? "",
    featured: project.featured,
    status: project.status,
    seoTitle: seo.title ?? "",
    seoDescription: seo.description ?? "",
    seoOgImage: seo.ogImage ?? "",
  };
}

async function readMediaMetadata(file: File, kind: "image" | "video") {
  const url = URL.createObjectURL(file);

  try {
    if (kind === "image") {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo leer la imagen."));
        image.src = url;
      });
      return {
        width: image.naturalWidth || undefined,
        height: image.naturalHeight || undefined,
        durationSeconds: undefined as number | undefined,
      };
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("No se pudo leer el vídeo."));
      video.src = url;
    });

    return {
      width: video.videoWidth || undefined,
      height: video.videoHeight || undefined,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProjectEditor({
  projectId,
  initialProject,
  initialMedia,
}: ProjectEditorProps) {
  const [project, setProject] = useState(initialProject);
  const [form, setForm] = useState<ProjectFormState>(() => toFormState(initialProject));
  const [mediaRows, setMediaRows] = useState(initialMedia);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRole, setUploadRole] = useState<"cover" | "hero" | "gallery" | "detail">(
    "gallery",
  );
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadSortOrder, setUploadSortOrder] = useState("0");
  const [manualUrl, setManualUrl] = useState("");
  const [manualKind, setManualKind] = useState<"image" | "video">("image");
  const [manualRole, setManualRole] = useState<"cover" | "hero" | "gallery" | "detail">(
    "gallery",
  );
  const [manualAltText, setManualAltText] = useState("");
  const [manualCaption, setManualCaption] = useState("");
  const [manualSortOrder, setManualSortOrder] = useState("0");
  const [manualWidth, setManualWidth] = useState("");
  const [manualHeight, setManualHeight] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshProject() {
    const response = await fetch(`/api/admin/projects?id=${projectId}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudo refrescar el proyecto.");
    }
    setProject(payload.data);
    setForm(toFormState(payload.data));
    setMediaRows(payload.media ?? []);
  }

  async function handleProjectSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          slug: form.slug,
          title: form.title,
          subtitle: form.subtitle || null,
          excerpt: form.excerpt || null,
          bodyMarkdown: form.bodyMarkdown || null,
          year: form.year ? Number(form.year) : null,
          clientName: form.clientName || null,
          category: form.category || null,
          featured: form.featured,
          status: form.status,
          seoJson: {
            title: form.seoTitle || undefined,
            description: form.seoDescription || undefined,
            ogImage: form.seoOgImage || undefined,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar el proyecto.");
      }

      setProject(payload.data);
      setForm(toFormState(payload.data));
      setMessage("Proyecto actualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMediaUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) {
      setError("Selecciona un archivo.");
      return;
    }

    const kind = uploadFile.type.startsWith("video/") ? "video" : "image";
    if ((uploadRole === "cover" || uploadRole === "hero") && !uploadAltText.trim()) {
      setError("El texto alternativo es obligatorio para portada y hero.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const presignResponse = await fetch("/api/admin/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.name,
          contentType: uploadFile.type,
          kind,
          projectId,
          fileSizeBytes: uploadFile.size,
        }),
      });
      const presignPayload = await presignResponse.json();
      if (!presignResponse.ok) {
        throw new Error(presignPayload.error ?? "No se pudo generar URL de subida.");
      }

      const uploadResponse = await fetch(presignPayload.uploadUrl as string, {
        method: "PUT",
        headers: {
          "Content-Type": uploadFile.type,
        },
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("La subida directa a R2 falló.");
      }

      const metadata = await readMediaMetadata(uploadFile, kind);

      const commitResponse = await fetch("/api/admin/media/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          kind,
          role: uploadRole,
          storageKey: presignPayload.storageKey,
          publicUrl: presignPayload.publicUrl,
          altText: uploadAltText || null,
          caption: uploadCaption || null,
          width: metadata.width ?? null,
          height: metadata.height ?? null,
          durationSeconds: metadata.durationSeconds ?? null,
          sortOrder: Number(uploadSortOrder || 0),
        }),
      });

      const commitPayload = await commitResponse.json();
      if (!commitResponse.ok) {
        throw new Error(commitPayload.error ?? "No se pudo registrar el recurso.");
      }

      setMessage("Recurso subido y registrado.");
      setUploadFile(null);
      setUploadAltText("");
      setUploadCaption("");
      setUploadSortOrder("0");
      await refreshProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado en la subida.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleManualMediaAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualUrl.trim()) {
      setError("Introduce una URL o ruta local para el recurso.");
      return;
    }

    if ((manualRole === "cover" || manualRole === "hero") && !manualAltText.trim()) {
      setError("El texto alternativo es obligatorio para portada y hero.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          kind: manualKind,
          role: manualRole,
          publicUrl: manualUrl.trim(),
          sourceType: "manual",
          altText: manualAltText || null,
          caption: manualCaption || null,
          width: manualWidth ? Number(manualWidth) : null,
          height: manualHeight ? Number(manualHeight) : null,
          durationSeconds: manualDuration ? Number(manualDuration) : null,
          sortOrder: Number(manualSortOrder || 0),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo registrar el recurso en modo manual.");
      }

      setMessage("Recurso manual registrado.");
      setManualUrl("");
      setManualAltText("");
      setManualCaption("");
      setManualSortOrder("0");
      setManualWidth("");
      setManualHeight("");
      setManualDuration("");
      await refreshProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado en recurso manual.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleMediaDelete(id: string) {
    if (!confirm("¿Eliminar este recurso?")) return;

    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el recurso.");
      }
      setMessage("Recurso eliminado.");
      await refreshProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl tracking-wide">{project.title}</h1>
          <p className="text-sm text-neutral-400">
            {project.slug} · {getStatusLabel(project.status)}
          </p>
        </div>
        <Link
          href="/admin/projects"
          className="rounded-md border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.12em] text-neutral-200 transition-colors hover:bg-white/10"
        >
          Volver a proyectos
        </Link>
      </div>

      <form
        onSubmit={handleProjectSave}
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5"
      >
        <h2 className="font-display text-2xl tracking-wide">Datos del proyecto</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Título</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Slug</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              required
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Subtítulo</span>
            <input
              value={form.subtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Categoría</span>
            <input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Cliente</span>
            <input
              value={form.clientName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, clientName: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Año</span>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as ProjectStatus,
                }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, featured: event.target.checked }))
              }
            />
            Destacado
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-neutral-300">Resumen</span>
          <textarea
            rows={3}
            value={form.excerpt}
            onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-neutral-300">Contenido (Markdown)</span>
          <textarea
            rows={8}
            value={form.bodyMarkdown}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, bodyMarkdown: event.target.value }))
            }
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Título SEO</span>
            <input
              value={form.seoTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Descripción SEO</span>
            <input
              value={form.seoDescription}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seoDescription: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Imagen OG SEO</span>
            <input
              value={form.seoOgImage}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seoOgImage: event.target.value }))
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
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

      <form
        onSubmit={handleManualMediaAdd}
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5"
      >
        <h2 className="font-display text-2xl tracking-wide">Recursos del proyecto (URL manual)</h2>
        <p className="text-sm text-neutral-400">
          Modo temporal sin R2: puedes registrar recursos por URL externa o ruta local de
          `public/` (ejemplo: `/assets/work-01.png`).
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm md:col-span-2 lg:col-span-4">
            <span className="text-neutral-300">URL pública o ruta local</span>
            <input
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="https://... o /assets/..."
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Tipo</span>
            <select
              value={manualKind}
              onChange={(event) => setManualKind(event.target.value as "image" | "video")}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="image">Imagen</option>
              <option value="video">Vídeo</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Rol</span>
            <select
              value={manualRole}
              onChange={(event) =>
                setManualRole(event.target.value as "cover" | "hero" | "gallery" | "detail")
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="cover">Portada</option>
              <option value="hero">Hero</option>
              <option value="gallery">Galería</option>
              <option value="detail">Detalle</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Orden</span>
            <input
              type="number"
              min={0}
              value={manualSortOrder}
              onChange={(event) => setManualSortOrder(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Texto alternativo</span>
            <input
              value={manualAltText}
              onChange={(event) => setManualAltText(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Pie de foto</span>
            <input
              value={manualCaption}
              onChange={(event) => setManualCaption(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Ancho (opcional)</span>
            <input
              type="number"
              min={1}
              value={manualWidth}
              onChange={(event) => setManualWidth(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Alto (opcional)</span>
            <input
              type="number"
              min={1}
              value={manualHeight}
              onChange={(event) => setManualHeight(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Duración en segundos (vídeo)</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={manualDuration}
              onChange={(event) => setManualDuration(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>

        {manualUrl ? (
          <div className="rounded-md border border-white/10 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.1em] text-neutral-500">Vista previa</p>
            {manualKind === "image" ? (
              <img
                src={manualUrl}
                alt={manualAltText || "vista previa manual"}
                className="h-48 w-full rounded-md object-cover"
              />
            ) : (
              <video src={manualUrl} controls className="h-48 w-full rounded-md object-cover" />
            )}
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
          >
            {isUploading ? "Guardando..." : "Guardar recurso manual"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleMediaUpload}
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5"
      >
        <h2 className="font-display text-2xl tracking-wide">Subir a R2 (opcional)</h2>
        <p className="text-sm text-neutral-400">
          La subida directa solo funciona cuando R2 está configurado. Si no, usa el bloque
          manual de arriba.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Archivo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Rol</span>
            <select
              value={uploadRole}
              onChange={(event) =>
                setUploadRole(event.target.value as "cover" | "hero" | "gallery" | "detail")
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="cover">Portada</option>
              <option value="hero">Hero</option>
              <option value="gallery">Galería</option>
              <option value="detail">Detalle</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Texto alternativo</span>
            <input
              value={uploadAltText}
              onChange={(event) => setUploadAltText(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Orden</span>
            <input
              type="number"
              min={0}
              value={uploadSortOrder}
              onChange={(event) => setUploadSortOrder(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-neutral-300">Pie de foto</span>
          <input
            value={uploadCaption}
            onChange={(event) => setUploadCaption(event.target.value)}
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={isUploading || !uploadFile}
            className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
          >
            {isUploading ? "Subiendo..." : "Subir a R2"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-2xl tracking-wide">Listado de recursos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {mediaRows.map((item) => (
            <article key={item.id} className="space-y-3 rounded-lg border border-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.1em] text-neutral-400">
                {getKindLabel(item.kind)} · {getRoleLabel(item.role)}
              </div>

              {item.kind === "image" ? (
                <img
                  src={item.public_url}
                  alt={item.alt_text ?? "recurso del proyecto"}
                  className="h-48 w-full rounded-md object-cover"
                />
              ) : (
                <video src={item.public_url} controls className="h-48 w-full rounded-md object-cover" />
              )}

              <div className="space-y-1 text-xs text-neutral-400">
                <p>texto alternativo: {item.alt_text ?? "-"}</p>
                <p>pie de foto: {item.caption ?? "-"}</p>
                <p>storage_key: {item.storage_key}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleMediaDelete(item.id)}
                className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10"
              >
                Eliminar recurso
              </button>
            </article>
          ))}

          {!mediaRows.length ? (
            <div className="rounded-lg border border-white/10 p-6 text-sm text-neutral-400">
              Este proyecto todavía no tiene recursos.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
