"use client";

import { useState } from "react";

import { BasicAdvancedToggle } from "@/components/admin/BasicAdvancedToggle";

type AdminTopbarProps = {
  email: string;
  role: "admin" | "editor";
};

export function AdminTopbar({ email, role }: AdminTopbarProps) {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function togglePreview(enabled: boolean) {
    setIsPreviewLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, path: "/" }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo cambiar el modo vista previa.");
      }

      if (enabled) {
        window.open(payload.path ?? "/", "_blank", "noopener,noreferrer");
        setMessage("Vista previa activada.");
      } else {
        setMessage("Vista previa desactivada.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de vista previa.");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  return (
    <header className="space-y-3 border-b border-white/10 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">CMS</p>
          <p className="text-sm text-neutral-200">
            {email} ·{" "}
            <span className="uppercase">
              {role === "admin" ? "ADMINISTRADOR" : "EDITOR"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BasicAdvancedToggle />
          <button
            type="button"
            onClick={() => void togglePreview(true)}
            disabled={isPreviewLoading}
            className="rounded-md border border-white/25 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
          >
            {isPreviewLoading ? "..." : "Vista previa"}
          </button>
          <button
            type="button"
            onClick={() => void togglePreview(false)}
            disabled={isPreviewLoading}
            className="rounded-md border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.12em] text-neutral-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed"
          >
            Cerrar vista previa
          </button>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-white/25 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </header>
  );
}
