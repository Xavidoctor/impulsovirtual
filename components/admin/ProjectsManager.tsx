"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { slugify } from "@/src/lib/admin/slugify";
import type { ProjectEntity, ProjectStatus } from "@/src/types/entities";

type CreateState = {
  title: string;
  slug: string;
  excerpt: string;
  client_name: string;
  live_url: string;
  status: ProjectStatus;
  progress_percentage: string;
  progress_label: string;
  progress_note: string;
  is_published: boolean;
  featured: boolean;
};

const emptyCreate: CreateState = {
  title: "",
  slug: "",
  excerpt: "",
  client_name: "",
  live_url: "",
  status: "completed",
  progress_percentage: "",
  progress_label: "",
  progress_note: "",
  is_published: false,
  featured: false,
};

export function ProjectsManager({ initialProjects }: { initialProjects: ProjectEntity[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [createForm, setCreateForm] = useState<CreateState>(emptyCreate);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...projects].sort((a, b) => {
      if (a.status !== b.status) return a.status === "completed" ? -1 : 1;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const aDate = a.published_at ?? a.updated_at;
      const bDate = b.published_at ?? b.updated_at;
      return bDate.localeCompare(aDate);
    });

    return sorted.filter((project) => {
      if (statusFilter === "published" && !project.is_published) return false;
      if (statusFilter === "draft" && project.is_published) return false;
      if (projectStatusFilter !== "all" && project.status !== projectStatusFilter) return false;
      if (!term) return true;
      return `${project.title} ${project.slug} ${project.client_name ?? ""} ${project.excerpt ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [projects, search, statusFilter, projectStatusFilter]);

  async function refreshProjects() {
    const response = await fetch("/api/admin/projects?includeUnpublished=true", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudieron recargar los proyectos.");
    }
    setProjects(payload.data ?? []);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const slug = slugify(createForm.slug || createForm.title);
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: createForm.title,
          excerpt: createForm.excerpt || null,
          client_name: createForm.client_name || null,
          live_url: createForm.live_url || null,
          website_url: createForm.live_url || null,
          status: createForm.status,
          progress_percentage:
            createForm.status === "in_progress" && createForm.progress_percentage.trim()
              ? Number(createForm.progress_percentage)
              : null,
          progress_label:
            createForm.status === "in_progress" ? createForm.progress_label || null : null,
          progress_note:
            createForm.status === "in_progress" ? createForm.progress_note || null : null,
          preview_mode: "embed",
          services_applied: [],
          featured: createForm.featured,
          is_published: createForm.is_published,
          published_at: createForm.is_published ? new Date().toISOString() : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el proyecto.");
      }

      setCreateForm(emptyCreate);
      setMessage("Proyecto creado. Abriendo editor...");
      await refreshProjects();
      router.push(`/admin/projects/${payload.data.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proyecto? También se eliminará su media asociada.")) return;
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el proyecto.");
      }
      await refreshProjects();
      setMessage("Proyecto eliminado.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Proyectos</h1>
        <p className="text-sm text-neutral-400">
          Crea proyectos nuevos y gestiona su publicación.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="font-display text-2xl tracking-wide">Nuevo proyecto</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm lg:col-span-2">
            <span className="text-neutral-300">Título</span>
            <input
              required
              value={createForm.title}
              onChange={(event) => {
                const value = event.target.value;
                setCreateForm((prev) => ({ ...prev, title: value, slug: prev.slug || slugify(value) }));
              }}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Slug</span>
            <input
              required
              value={createForm.slug}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Cliente</span>
            <input
              value={createForm.client_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, client_name: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">URL real</span>
            <input
              value={createForm.live_url}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, live_url: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado de proyecto</span>
            <select
              value={createForm.status}
              onChange={(event) =>
                setCreateForm((prev) => ({
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
          {createForm.status === "in_progress" ? (
            <>
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Progreso (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={createForm.progress_percentage}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, progress_percentage: event.target.value }))
                  }
                  className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Etiqueta de progreso</span>
                <input
                  value={createForm.progress_label}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, progress_label: event.target.value }))
                  }
                  className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm lg:col-span-4">
                <span className="text-neutral-300">Nota de estado</span>
                <input
                  value={createForm.progress_note}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, progress_note: event.target.value }))
                  }
                  placeholder="Ej: Ajustes finales de QA y contenidos."
                  className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                />
              </label>
            </>
          ) : null}
          <label className="space-y-1 text-sm lg:col-span-4">
            <span className="text-neutral-300">Extracto</span>
            <textarea
              rows={2}
              value={createForm.excerpt}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, excerpt: event.target.value }))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 text-neutral-300">
            <input
              type="checkbox"
              checked={createForm.featured}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, featured: event.target.checked }))}
            />
            Destacado
          </label>
          <label className="flex items-center gap-2 text-neutral-300">
            <input
              type="checkbox"
              checked={createForm.is_published}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, is_published: event.target.checked }))}
            />
            Publicado
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creando..." : "Crear proyecto"}
          </button>
          {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
          {error ? <span className="text-sm text-red-300">{error}</span> : null}
        </div>
      </form>

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="w-full space-y-1 text-sm md:max-w-md">
            <span className="text-neutral-300">Buscar proyecto</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | "published" | "draft")
              }
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Fase</span>
            <select
              value={projectStatusFilter}
              onChange={(event) =>
                setProjectStatusFilter(event.target.value as "all" | ProjectStatus)
              }
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="all">Todas</option>
              <option value="completed">Completados</option>
              <option value="in_progress">En desarrollo</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void refreshProjects()}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
          >
            Recargar
          </button>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <article key={project.id} className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-white">{project.title}</h3>
                  <p className="text-xs text-neutral-400">/{project.slug}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                  <span className="rounded-full border border-white/20 px-2 py-1">
                    {project.is_published ? "Publicado" : "Borrador"}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-1 ${
                      project.status === "completed"
                        ? "border-emerald-300/35 text-emerald-200"
                        : "border-accent/35 text-accent"
                    }`}
                  >
                    {project.status === "completed" ? "Completado" : "En desarrollo"}
                  </span>
                  {project.featured ? (
                    <span className="rounded-full border border-emerald-300/35 px-2 py-1 text-emerald-200">
                      Destacado
                    </span>
                  ) : null}
                  {project.client_name ? (
                    <span className="rounded-full border border-white/20 px-2 py-1">{project.client_name}</span>
                  ) : null}
                </div>
                {project.status === "in_progress" ? (
                  <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent/70 via-accent to-emerald-200/80"
                        style={{ width: `${project.progress_percentage ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-400">
                      Progreso: {project.progress_percentage ?? 0}%{project.progress_note ? ` · ${project.progress_note}` : ""}
                    </p>
                  </div>
                ) : null}
                <p className="text-xs text-neutral-500">
                  Actualizado: {new Date(project.updated_at).toLocaleString("es-ES")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="rounded-md border border-white/25 px-3 py-1 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                  >
                    Abrir editor
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(project.id)}
                    className="rounded-md border border-red-400/30 px-3 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/25 p-6 text-sm text-neutral-400">
            No hay proyectos para este filtro.
          </div>
        )}
      </section>
    </section>
  );
}
