"use client";

import { useState } from "react";

import type { Tables } from "@/src/types/database.types";

type ReleaseRow = Tables<"releases">;

type ReleasesManagerProps = {
  initialReleases: ReleaseRow[];
  isAdmin: boolean;
};

export function ReleasesManager({ initialReleases, isAdmin }: ReleasesManagerProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBackId, setIsRollingBackId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshReleases() {
    const response = await fetch("/api/admin/releases", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudieron cargar las publicaciones.");
    }
    setReleases(payload.data ?? []);
  }

  async function handlePublish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) {
      setError("Solo el administrador puede publicar.");
      return;
    }

    setIsPublishing(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label || undefined,
          notes: notes || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo publicar.");
      }

      setMessage(`Publicación realizada: ${payload.data.release.label}`);
      setLabel("");
      setNotes("");
      await refreshReleases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleRollback(releaseId: string) {
    if (!isAdmin) {
      setError("Solo el administrador puede restaurar versiones.");
      return;
    }

    if (!confirm("¿Seguro que quieres restaurar esta versión?")) {
      return;
    }

    setIsRollingBackId(releaseId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo restaurar la version.");
      }

      setMessage(`Versión restaurada: ${payload.data.release.label}`);
      await refreshReleases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restaurar la versión.");
    } finally {
      setIsRollingBackId(null);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Publicaciones</h1>
        <p className="text-sm text-neutral-400">
          Publica una instantánea del CMS y restaura versiones anteriores sin tocar código.
        </p>
      </div>

      {!isAdmin ? (
        <div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Tu rol es editor: puedes ver publicaciones, pero no publicar ni restaurar versiones.
        </div>
      ) : null}

      <form
        onSubmit={handlePublish}
        className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5"
      >
        <h2 className="font-display text-2xl tracking-wide">Publicar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Etiqueta (opcional)</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Publicación marzo 2026"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Notas (opcional)</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Cambios principales"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!isAdmin || isPublishing}
            className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500"
          >
            {isPublishing ? "Publicando..." : "Publicar"}
          </button>
          <button
            type="button"
            onClick={() => void refreshReleases()}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
          >
            Recargar
          </button>
          {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
          {error ? <span className="text-sm text-red-300">{error}</span> : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left">Etiqueta</th>
              <th className="px-3 py-2 text-left">Publicado el</th>
              <th className="px-3 py-2 text-left">Notas</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {releases.map((release) => (
              <tr key={release.id}>
                <td className="px-3 py-2 text-neutral-200">{release.label}</td>
                <td className="px-3 py-2 text-neutral-400">
                  {new Date(release.published_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-neutral-400">{release.notes ?? "-"}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={!isAdmin || isRollingBackId === release.id}
                    onClick={() => void handleRollback(release.id)}
                    className="rounded-md border border-white/20 px-2 py-1 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500"
                  >
                    {isRollingBackId === release.id ? "..." : "Restaurar versión"}
                  </button>
                </td>
              </tr>
            ))}
            {!releases.length ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-neutral-400">
                  Aún no hay publicaciones.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
