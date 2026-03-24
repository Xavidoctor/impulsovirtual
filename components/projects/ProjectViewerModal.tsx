"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { ProjectEntity } from "@/src/types/entities";

type PreviewState = "loading" | "ready" | "error";

type ProjectViewerModalProps = {
  project: ProjectEntity | null;
  onClose: () => void;
};

function resolveLiveUrl(project: ProjectEntity) {
  return project.live_url || project.website_url || null;
}

function resolveCategory(project: ProjectEntity) {
  return project.status === "completed" ? "Proyecto lanzado" : "Proyecto en desarrollo";
}

function ProjectInfoContent({
  project,
  liveUrl,
}: {
  project: ProjectEntity;
  liveUrl: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="editorial-kicker">Visor del proyecto</p>
        <h3 className="text-3xl font-display leading-[0.95] text-foreground">{project.title}</h3>
        <p className="text-sm leading-relaxed text-muted">{project.excerpt}</p>
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Categoría</p>
          <p className="mt-1 text-foreground/90">{resolveCategory(project)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Estado</p>
          <p className="mt-1 text-foreground/90">
            {project.status === "completed" ? "Completado" : "En desarrollo"}
          </p>
          {project.status === "in_progress" ? (
            <div className="mt-3 space-y-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent/75 via-accent to-emerald-200/80"
                  style={{ width: `${project.progress_percentage ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-muted">
                {project.progress_percentage ?? 0}%
                {project.progress_label ? ` · ${project.progress_label}` : ""}
              </p>
            </div>
          ) : null}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Orientación</p>
          <p className="mt-1 text-foreground/90">
            {project.project_orientation || "Proyecto digital premium"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Qué se ha hecho</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {project.what_was_done || project.description || project.excerpt}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Servicios aplicados</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(project.services_applied.length > 0
              ? project.services_applied
              : ["Diseño web premium"]).map((service) => (
              <span
                key={`${project.id}-${service}`}
                className="rounded-full border border-white/15 bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-200"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>

      {liveUrl ? (
        <Link href={liveUrl} target="_blank" rel="noreferrer" className="focus-ring btn-primary w-full">
          Abrir sitio
        </Link>
      ) : null}
    </div>
  );
}

export function ProjectViewerModal({ project, onClose }: ProjectViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>("loading");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [iframeNonce, setIframeNonce] = useState(0);

  const liveUrl = useMemo(() => (project ? resolveLiveUrl(project) : null), [project]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!project) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, project]);

  useEffect(() => {
    if (!project) return;

    setIsMobilePanelOpen(false);
    setPreviewViewport("desktop");
    setIframeNonce(0);

    if (!liveUrl) {
      setPreviewState("error");
      return;
    }

    setPreviewState("loading");
    const timer = window.setTimeout(() => {
      setPreviewState((current) => (current === "ready" ? current : "error"));
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [project, liveUrl]);

  if (!project || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Visor de ${project.title}`}
        className="grid h-[100dvh] min-h-[100svh] w-screen overflow-hidden border-y border-white/15 bg-[#080b0d] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] lg:grid-cols-[360px_1fr] lg:border"
      >
        <aside className="relative hidden overflow-y-auto border-r border-white/10 bg-[#0a1013] lg:block">
          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-end gap-2">
            {liveUrl ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewViewport((current) =>
                    current === "desktop" ? "mobile" : "desktop",
                  )
                }
                className="focus-ring rounded-full border border-white/20 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-neutral-200 transition-colors hover:bg-white/10"
              >
                {previewViewport === "desktop" ? "Modo móvil" : "Modo escritorio"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-full border border-white/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-200 transition-colors hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
          <div className="space-y-6 p-6 pt-16">
            <ProjectInfoContent project={project} liveUrl={liveUrl} />
          </div>
        </aside>

        <div className="relative flex min-h-0 flex-col overflow-hidden bg-[#070b0d]">
          <div className="border-b border-white/10 bg-[#0a1013]/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen((current) => !current)}
                className="focus-ring rounded-full border border-white/20 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-200 transition-colors hover:bg-white/10"
              >
                <span className={`inline-block transition-transform ${isMobilePanelOpen ? "rotate-180" : ""}`}>
                  v
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent/80">
                  {isMobilePanelOpen ? "Ocultar detalles" : "Mostrar detalles"}
                </p>
                <p className="truncate text-sm text-foreground">{project.title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-full border border-white/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-200 transition-colors hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
            <div
              className={`overflow-hidden border-t border-white/10 transition-[max-height,opacity] duration-300 ${isMobilePanelOpen ? "max-h-[72vh] opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="max-h-[58vh] overflow-y-auto px-4 pb-4 pt-4">
                <ProjectInfoContent project={project} liveUrl={liveUrl} />
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {!liveUrl ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div className="max-w-xl space-y-2 rounded-xl border border-white/10 bg-black/30 p-6">
                  <p className="text-lg font-display text-foreground">Vista previa no disponible</p>
                  <p className="text-sm text-muted">
                    Este proyecto todavía no tiene una URL pública para mostrarse en el visor.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`h-full w-full ${
                    previewViewport === "mobile"
                      ? "flex items-center justify-center p-4 lg:p-6"
                      : ""
                  }`}
                >
                  <div
                    className={
                      previewViewport === "mobile"
                        ? "h-full w-full max-h-[calc(100dvh-7.5rem)] max-w-[390px] overflow-hidden rounded-[30px] border border-white/15 bg-black shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] overscroll-contain"
                        : "h-full w-full"
                    }
                  >
                    <iframe
                      key={`${project.id}-${liveUrl}-${iframeNonce}`}
                      src={liveUrl}
                      title={`Vista previa de ${project.title}`}
                      className={`border-0 [touch-action:pan-x_pan-y_pinch-zoom] ${
                        previewViewport === "mobile"
                          ? "h-full w-[390px] max-w-full"
                          : "h-full w-full"
                      }`}
                      onLoad={() => setPreviewState("ready")}
                      onError={() => setPreviewState("error")}
                    />
                  </div>
                </div>
                {previewState === "loading" ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#070b0d]/75">
                    <div className="space-y-2 text-center">
                      <p className="text-sm uppercase tracking-[0.16em] text-accent">Cargando vista previa</p>
                      <p className="text-xs text-muted">Preparando visor del proyecto...</p>
                    </div>
                  </div>
                ) : null}
                {previewState === "error" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#070b0d]/84 p-6">
                    <div className="max-w-lg space-y-3 rounded-xl border border-white/10 bg-black/45 p-6 text-center">
                      <p className="text-lg font-display text-foreground">
                        No hemos podido cargar la vista previa
                      </p>
                      <p className="text-sm text-muted">
                        Puede deberse a restricciones del dominio o a un bloqueo temporal.
                      </p>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewState("loading");
                            setIframeNonce((current) => current + 1);
                          }}
                          className="focus-ring rounded-full border border-white/20 bg-black/55 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-neutral-200 transition-colors hover:bg-black/75"
                        >
                          Reintentar carga
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

