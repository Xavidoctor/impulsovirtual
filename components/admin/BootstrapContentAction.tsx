"use client";

import { useState } from "react";

export function BootstrapContentAction({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<null | {
    sections: { inserted: number; updated: number; skipped: number };
    settings: { inserted: number; updated: number; skipped: number };
    projects: { inserted: number; updated: number; skipped: number };
    media: { inserted: number; updated: number; skipped: number };
  }>(null);
  const [error, setError] = useState("");

  async function runBootstrap() {
    if (!isAdmin) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bootstrap-content", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo importar el contenido actual.");
      }
      setReport(payload.report ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar contenido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl tracking-wide">Importar contenido actual</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Importa el contenido visible actual al CMS (idempotente, solo publicado).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runBootstrap()}
          disabled={!isAdmin || loading}
          className="rounded-md border border-white/25 px-4 py-2 text-xs uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500"
        >
          {loading ? "Ejecutando..." : "Importar contenido actual"}
        </button>
      </div>

      {!isAdmin ? (
        <p className="mt-3 text-xs text-amber-300">Solo el administrador puede importar contenido.</p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      {report ? (
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(report).map(([key, row]) => (
            <div key={key} className="rounded-md border border-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-neutral-400">
                {key === "sections"
                  ? "Secciones"
                  : key === "settings"
                    ? "Ajustes"
                    : key === "projects"
                      ? "Proyectos"
                      : "Recursos"}
              </p>
              <p className="mt-1 text-neutral-200">creados: {row.inserted}</p>
              <p className="text-neutral-300">actualizados: {row.updated}</p>
              <p className="text-neutral-300">omitidos: {row.skipped}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
