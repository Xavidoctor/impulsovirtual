"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Tables } from "@/src/types/database.types";

type ProjectRow = Tables<"projects">;
type ProjectStatus = "draft" | "published" | "archived";

function getStatusLabel(status: ProjectStatus) {
  if (status === "draft") return "Borrador";
  if (status === "published") return "Publicado";
  return "Archivado";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function ProjectsManager({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("draft");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      [project.title, project.slug, project.category ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [projects, search]);

  async function refreshProjects() {
    const response = await fetch("/api/admin/projects", { cache: "no-store" });
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
      const finalSlug = slug || slugify(title);
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalSlug,
          title,
          category: category || null,
          status,
          featured: false,
          seoJson: {},
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el proyecto.");
      }

      setMessage("Proyecto creado.");
      setTitle("");
      setSlug("");
      setCategory("");
      await refreshProjects();
      router.push(`/admin/projects/${payload.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;

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

      setMessage("Proyecto eliminado.");
      await refreshProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Proyectos</h1>
        <p className="text-sm text-neutral-400">
          Listado y alta inicial de proyectos. Edita cada proyecto en detalle desde su página.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Título</span>
            <input
              required
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setTitle(nextTitle);
                if (!slug) {
                  setSlug(slugify(nextTitle));
                }
              }}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Slug</span>
            <input
              required
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Categoría</span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ProjectStatus)
              }
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
          >
            Crear proyecto
          </button>
          <button
            type="button"
            onClick={() => void refreshProjects()}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
          >
            Recargar
          </button>
          {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
          {error ? <span className="text-sm text-red-300">{error}</span> : null}
        </div>
      </form>

      <div className="space-y-3">
        <input
          placeholder="Buscar por título, slug o categoría..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm md:max-w-md"
        />

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Destacado</th>
                <th className="px-3 py-2 text-left">Actualizado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td className="px-3 py-2 text-neutral-200">{project.title}</td>
                  <td className="px-3 py-2 text-neutral-300">{project.slug}</td>
                  <td className="px-3 py-2 text-neutral-300">
                    {getStatusLabel(project.status)}
                  </td>
                  <td className="px-3 py-2 text-neutral-300">
                    {project.featured ? "Si" : "No"}
                  </td>
                  <td className="px-3 py-2 text-neutral-400">
                    {new Date(project.updated_at).toLocaleString()}
                  </td>
                  <td className="space-x-2 px-3 py-2 text-right">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="rounded-md border border-white/15 px-2 py-1 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project.id)}
                      className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-neutral-400">
                    No hay proyectos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
