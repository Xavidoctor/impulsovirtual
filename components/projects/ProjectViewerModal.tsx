"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { ProjectEntity } from "@/src/types/entities";

type PreviewState = "loading" | "ready" | "fallback";

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
  const [manualFallback, setManualFallback] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");

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

    setManualFallback(false);
    setIsMobilePanelOpen(false);
    setPreviewViewport("desktop");
    if (project.preview_mode === "image" || project.preview_mode === "external_only" || !liveUrl) {
      setPreviewState("fallback");
      return;
    }

    setPreviewState("loading");
    const timer = window.setTimeout(() => {
      setPreviewState((current) => (current === "ready" ? current : "fallback"));
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [project, liveUrl]);

  if (!project || !mounted) return null;

  const showFallback = manualFallback || previewState === "fallback";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Visor de ${project.title}`}
        className="grid h-[100dvh] min-h-[100svh] w-screen overflow-hidden border-y border-white/15 bg-[#080b0d] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] lg:grid-cols-[360px_1fr] lg:border"
      >
        <aside className="relative hidden overflow-y-auto border-r border-white/10 bg-[#0a1013] lg:block">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring absolute right-4 top-4 rounded-full border border-white/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-200 transition-colors hover:bg-white/10"
          >
            Cerrar
          </button>
          <div className="space-y-6 p-6 pt-14">
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
            <div className="absolute right-4 top-4 z-20 hidden lg:block">
              {!showFallback && project.preview_mode === "embed" && liveUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewViewport((current) =>
                      current === "desktop" ? "mobile" : "desktop",
                    )
                  }
                  className="focus-ring rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-neutral-200 transition-colors hover:bg-black/75"
                >
                  {previewViewport === "desktop" ? "Modo móvil" : "Modo escritorio"}
                </button>
              ) : null}
            </div>

            {showFallback ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3">
                  <img
                    src={project.preview_image_url || project.cover_image_url || "/og-cover.svg"}
                    alt={`Vista previa de ${project.title}`}
                    className="h-[52vh] w-full rounded-lg object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-display text-foreground">
                    Vista previa externa no disponible
                  </p>
                  <p className="max-w-xl text-sm text-muted">
                    {project.preview_mode === "external_only"
                      ? "Este proyecto usa modo externo. Abre el sitio para ver la experiencia completa."
                      : "Este dominio no permite embeber su web dentro de un iframe. Puedes abrir el sitio en una pestaña nueva."}
                  </p>
                </div>
                {liveUrl ? (
                  <Link href={liveUrl} target="_blank" rel="noreferrer" className="focus-ring btn-primary">
                    Abrir sitio
                  </Link>
                ) : null}
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
                      key={`${project.id}-${liveUrl}`}
                      src={liveUrl ?? undefined}
                      title={`Vista previa de ${project.title}`}
                      className={`border-0 [touch-action:pan-x_pan-y_pinch-zoom] ${
                        previewViewport === "mobile"
                          ? "h-full w-[390px] max-w-full"
                          : "h-full w-full"
                      }`}
                      onLoad={() => setPreviewState("ready")}
                      onError={() => setPreviewState("fallback")}
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
              </>
            )}

            {!showFallback && project.preview_mode === "embed" ? (
              <button
                type="button"
                onClick={() => setManualFallback(true)}
                className="focus-ring absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-neutral-200 transition-colors hover:bg-black/75"
              >
                Mostrar alternativa
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

