import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/PublicPageShell";
import { ProjectViewerTrigger } from "@/components/projects/ProjectViewerTrigger";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { projects as fallbackProjects } from "@/content/projects";
import { getProjectBySlug, listProjects } from "@/src/lib/domain/projects";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import type { ProjectEntity } from "@/src/types/entities";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

function mapFallbackProjectToEntity(
  fallback: (typeof fallbackProjects)[number],
): ProjectEntity {
  return {
    id: fallback.slug,
    slug: fallback.slug,
    title: fallback.title,
    client_name: null,
    excerpt: fallback.shortDescription,
    description: fallback.fullDescription,
    challenge: null,
    solution: null,
    results: null,
    cover_image_url: fallback.coverImage,
    company_logo_url: fallback.companyLogoUrl ?? null,
    website_url: fallback.websiteUrl ?? null,
    live_url: fallback.websiteUrl ?? null,
    featured: fallback.featured,
    status: fallback.status === "in_progress" ? "in_progress" : "completed",
    progress_percentage: fallback.status === "in_progress" ? fallback.progressPercentage ?? 0 : null,
    progress_label: fallback.status === "in_progress" ? fallback.progressLabel ?? null : null,
    progress_note: fallback.status === "in_progress" ? fallback.progressNote ?? null : null,
    project_orientation: fallback.projectOrientation ?? fallback.category,
    what_was_done: fallback.whatWasDone ?? fallback.fullDescription,
    services_applied: fallback.servicesApplied ?? fallback.services,
    preview_mode: (fallback.previewMode === "image" ? "image" : "embed") as "embed" | "image",
    preview_image_url: fallback.previewImageUrl ?? fallback.coverImage,
    is_published: true,
    published_at: null,
    seo_title: null,
    seo_description: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

export async function generateStaticParams() {
  const projects = await listProjects({ includeUnpublished: false, includeMedia: false });
  if (projects.length > 0) {
    return projects.map((project) => ({ slug: project.slug }));
  }

  return fallbackProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = getCanonicalUrl(`/proyectos/${slug}`);
  const [project, site] = await Promise.all([
    getProjectBySlug(slug, { includeUnpublished: false, includeMedia: true }),
    getPublicSiteContext(),
  ]);

  if (!project) {
    const fallback = fallbackProjects.find((item) => item.slug === slug);
    if (!fallback) {
      return {
        title: "Proyecto no encontrado",
        alternates: {
          canonical,
        },
      };
    }

    return {
      title: fallback.title,
      description: fallback.shortDescription,
      alternates: {
        canonical,
      },
      openGraph: {
        title: `${fallback.title} | ${site.brandName}`,
        description: fallback.shortDescription,
        images: [fallback.coverImage || site.seo.ogImage],
        url: canonical,
      },
    };
  }

  const description = project.seo_description || project.excerpt;
  return {
    title: project.seo_title || project.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${project.title} | ${site.brandName}`,
      description,
      images: [project.cover_image_url || project.media[0]?.file_url || site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function ProyectoDetallePage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug, { includeUnpublished: false, includeMedia: true });

  if (!project) {
    const fallback = fallbackProjects.find((item) => item.slug === slug);
    if (!fallback) notFound();
    const fallbackEntity = mapFallbackProjectToEntity(fallback);

    return (
      <PublicPageShell>
        <section className="section-padding pb-14 pt-8">
          <div className="container-width space-y-8">
            <Link
              href="/proyectos"
              className="focus-ring lift-link"
            >
              ← Volver a proyectos
            </Link>

            <div className="page-intro">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${fallback.status === "in_progress" ? "border-accent/35 bg-accentSoft text-accent" : "border-emerald-300/35 bg-emerald-500/10 text-emerald-200"}`}>
                {fallback.status === "in_progress" ? "En desarrollo" : "Completado"}
              </span>
              <h1 className="hero-title font-display leading-[0.92]">
                {fallback.title}
              </h1>
              <p className="section-copy">{fallback.shortDescription}</p>
              {fallback.projectOrientation ? (
                <p className="text-xs uppercase tracking-[0.16em] text-accent/85">
                  {fallback.projectOrientation}
                </p>
              ) : null}
              <ProjectViewerTrigger project={fallbackEntity} label="Visualizar web" />
              {fallback.status === "in_progress" ? (
                <div className="max-w-md space-y-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent/75 via-accent to-emerald-200/80"
                      style={{ width: `${fallback.progressPercentage ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    {fallback.progressPercentage ?? 0}%
                    {fallback.progressLabel ? ` · ${fallback.progressLabel}` : ""}
                    {" · "}
                    {fallback.progressNote || "Trabajo activo en curso."}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="premium-card p-7 text-sm leading-relaxed text-muted">
              {fallback.whatWasDone || fallback.fullDescription}
            </div>

            {(fallback.servicesApplied ?? fallback.services).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(fallback.servicesApplied ?? fallback.services).map((service) => (
                  <span
                    key={`${fallback.slug}-${service}`}
                    className="rounded-full border border-white/15 bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-200"
                  >
                    {service}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </PublicPageShell>
    );
  }

  const media =
    project.media.length > 0
      ? project.media
      : project.cover_image_url
        ? [
            {
              id: `${project.id}-cover`,
              project_id: project.id,
              file_url: project.cover_image_url,
              alt: project.title,
              caption: "Imagen de portada",
              sort_order: 0,
              created_at: project.created_at,
            },
          ]
        : [];

  return (
    <PublicPageShell>
      <section className="section-padding pb-14 pt-8">
        <div className="container-width space-y-10">
          <Link
            href="/proyectos"
            className="focus-ring lift-link"
          >
            ← Volver a proyectos
          </Link>

          <Reveal className="page-intro">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-accent">
                {project.client_name || "Proyecto"}
              </p>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${project.status === "in_progress" ? "border-accent/35 bg-accentSoft text-accent" : "border-emerald-300/35 bg-emerald-500/10 text-emerald-200"}`}>
                {project.status === "in_progress" ? "En desarrollo" : "Completado"}
              </span>
            </div>
            <h1 className="hero-title font-display leading-[0.92]">
              {project.title}
            </h1>
            <p className="section-copy">{project.excerpt}</p>
            {project.project_orientation ? (
              <p className="text-xs uppercase tracking-[0.16em] text-accent/85">
                {project.project_orientation}
              </p>
            ) : null}
            <ProjectViewerTrigger project={project} label="Visualizar web" />
            {project.status === "in_progress" ? (
              <div className="max-w-md space-y-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/75 via-accent to-emerald-200/80"
                    style={{ width: `${project.progress_percentage ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  {project.progress_percentage ?? 0}%
                  {project.progress_label ? ` · ${project.progress_label}` : ""}
                  {" · "}
                  {project.progress_note || "Trabajo activo en curso."}
                </p>
              </div>
            ) : null}
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {project.challenge ? (
              <Reveal>
                <article className="premium-card h-full p-5">
                <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Reto</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{project.challenge}</p>
                </article>
              </Reveal>
            ) : null}
            {project.solution ? (
              <Reveal delay={0.05}>
                <article className="premium-card h-full p-5">
                <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Solución</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{project.solution}</p>
                </article>
              </Reveal>
            ) : null}
            {project.results ? (
              <Reveal delay={0.1}>
                <article className="premium-card h-full p-5">
                <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Resultados</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{project.results}</p>
                </article>
              </Reveal>
            ) : null}
          </div>

          {project.services_applied.length > 0 ? (
            <Reveal>
              <div className="flex flex-wrap gap-2">
                {project.services_applied.map((service) => (
                  <span
                    key={`${project.id}-${service}`}
                    className="rounded-full border border-white/15 bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-200"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </Reveal>
          ) : null}

          <Reveal>
            <div className="premium-card p-7">
            <p className="text-sm leading-relaxed text-muted">
              {project.what_was_done || project.description || project.excerpt}
            </p>
            </div>
          </Reveal>

          {media.length > 0 ? (
            <div className="space-y-5 border-t border-border pt-8">
              <h2 className="text-4xl font-display text-foreground md:text-5xl">
                Galería
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {media.map((item, index) => (
                  <Reveal key={item.id} delay={index * 0.06}>
                    <figure className="premium-card overflow-hidden p-4">
                    <img
                      src={item.file_url}
                      alt={item.alt || project.title}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 768px) 44vw, 96vw"
                      className="h-64 w-full rounded-lg object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                    {item.caption ? (
                      <figcaption className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">
                        {item.caption}
                      </figcaption>
                    ) : null}
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PublicPageShell>
  );
}
