"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminTopbarProps = {
  email: string;
  role: "admin" | "editor";
};

export function AdminTopbar({ email, role }: AdminTopbarProps) {
  const router = useRouter();
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPublishLoading, setIsPublishLoading] = useState(false);
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

  async function quickPublish() {
    if (role !== "admin") {
      setError("Solo el administrador puede publicar.");
      return;
    }

    setIsPublishLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo publicar.");
      }

      setMessage(`Publicación realizada: ${payload.data.release.label}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setIsPublishLoading(false);
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
          <button
            type="button"
            onClick={() => void quickPublish()}
            disabled={isPublishLoading || role !== "admin"}
            className="rounded-md border border-white/25 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500"
          >
            {isPublishLoading ? "Publicando..." : "Publicar"}
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
