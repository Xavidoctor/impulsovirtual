"use client";

import Link from "next/link";
import { useState } from "react";

import { ProjectViewerModal } from "@/components/projects/ProjectViewerModal";
import type { ProjectEntity } from "@/src/types/entities";

type ProjectsExperienceProps = {
  launchedProjects: ProjectEntity[];
  inProgressProjects: ProjectEntity[];
};

function ProjectLogo({ project }: { project: ProjectEntity }) {
  if (!project.company_logo_url) {
    return project.client_name ? (
      <span className="text-xs uppercase tracking-[0.15em] text-muted">{project.client_name}</span>
    ) : null;
  }

  return (
    <div className="flex h-9 w-[128px] items-center justify-end">
      <img
        src={project.company_logo_url}
        alt={`Logo de ${project.title}`}
        loading="lazy"
        decoding="async"
        className="max-h-8 w-auto max-w-full object-contain [filter:drop-shadow(0_8px_20px_rgba(0,0,0,0.45))]"
      />
    </div>
  );
}

export function ProjectsExperience({
  launchedProjects,
  inProgressProjects,
}: ProjectsExperienceProps) {
  const [activeProject, setActiveProject] = useState<ProjectEntity | null>(null);

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="editorial-kicker">Bloque 01</p>
            <h2 className="section-title font-display">Proyectos lanzados</h2>
          </div>
          <span className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-emerald-100">
            {launchedProjects.length} completados
          </span>
        </div>

        {launchedProjects.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {launchedProjects.map((project) => (
              <article key={project.id} className="premium-card elevate-hover h-full space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-200">
                    Completado
                  </span>
                  <ProjectLogo project={project} />
                </div>
                <h3 className="text-3xl font-display text-foreground">{project.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{project.excerpt}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em]">
                  <button
                    type="button"
                    onClick={() => setActiveProject(project)}
                    className="focus-ring lift-link"
                  >
                    Abrir visor
                  </button>
                  <Link href={`/proyectos/${project.slug}`} className="focus-ring lift-link">
                    Ver ficha
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="premium-card p-6 text-sm text-muted">
            Todavia no hay proyectos marcados como completados.
          </div>
        )}
      </section>

      <section className="space-y-5 border-t border-border pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="editorial-kicker">Bloque 02</p>
            <h2 className="section-title font-display">Proyectos en desarrollo</h2>
          </div>
          <span className="rounded-full border border-accent/35 bg-accentSoft px-3 py-1 text-xs uppercase tracking-[0.14em] text-accent">
            {inProgressProjects.length} en curso
          </span>
        </div>

        {inProgressProjects.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {inProgressProjects.map((project) => (
              <article key={project.id} className="premium-card elevate-hover h-full space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full border border-accent/35 bg-accentSoft px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-accent">
                      En desarrollo
                    </span>
                    <h3 className="text-2xl font-display text-foreground">{project.title}</h3>
                  </div>
                  <div className="space-y-2 text-right">
                    <ProjectLogo project={project} />
                    <p className="text-sm font-medium text-foreground">{project.progress_percentage ?? 0}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent/75 via-accent to-emerald-200/80"
                      style={{ width: `${project.progress_percentage ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-muted">
                    {project.progress_label ? `${project.progress_label} · ` : ""}
                    {project.progress_note || "Ejecucion activa con avance sostenido y foco en calidad final."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em]">
                  <button
                    type="button"
                    onClick={() => setActiveProject(project)}
                    className="focus-ring lift-link"
                  >
                    Abrir visor
                  </button>
                  <Link href={`/proyectos/${project.slug}`} className="focus-ring lift-link">
                    Ver ficha
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="premium-card p-6 text-sm text-muted">
            No hay proyectos en desarrollo visibles en este momento.
          </div>
        )}
      </section>

      <ProjectViewerModal project={activeProject} onClose={() => setActiveProject(null)} />
    </>
  );
}

