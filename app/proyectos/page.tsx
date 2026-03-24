import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";
import { ProjectsExperience } from "@/components/projects/ProjectsExperience";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { projects as fallbackProjects } from "@/content/projects";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { listProjects } from "@/src/lib/domain/projects";
import type { ProjectEntity } from "@/src/types/entities";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/proyectos");
  return {
    title: "Proyectos",
    description: "Casos reales de estrategia, diseño web premium y sistemas digitales de crecimiento.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Proyectos | ${site.brandName}`,
      description:
        "Casos reales de estrategia, diseño web premium y sistemas digitales de crecimiento.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function ProyectosPage() {
  const domainProjects = await listProjects({ includeUnpublished: false, includeMedia: false });
  const projects =
    domainProjects.length > 0
      ? domainProjects
      : fallbackProjects.map<ProjectEntity>((project) => ({
          id: project.slug,
          slug: project.slug,
          title: project.title,
          client_name: null,
          excerpt: project.shortDescription,
          description: project.fullDescription,
          challenge: null,
          solution: null,
          results: null,
          cover_image_url: project.coverImage,
          company_logo_url: project.companyLogoUrl ?? null,
          website_url: project.websiteUrl ?? null,
          live_url: project.websiteUrl ?? null,
          featured: project.featured,
          status: project.status === "in_progress" ? ("in_progress" as const) : ("completed" as const),
          progress_percentage:
            project.status === "in_progress" ? project.progressPercentage ?? 0 : null,
          progress_label:
            project.status === "in_progress" ? project.progressLabel ?? null : null,
          progress_note: project.status === "in_progress" ? project.progressNote ?? null : null,
          project_orientation: project.projectOrientation ?? project.category,
          what_was_done: project.whatWasDone ?? project.fullDescription,
          services_applied: project.servicesApplied ?? project.services,
          preview_mode: project.previewMode ?? "embed",
          preview_image_url: project.previewImageUrl ?? project.coverImage,
          is_published: true,
          published_at: null,
          seo_title: null,
          seo_description: null,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
          media: [],
        }));

  const launchedProjects = projects.filter((project) => project.status === "completed");
  const inProgressProjects = projects.filter((project) => project.status === "in_progress");

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-12">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Casos</p>
            <h1 className="hero-title font-display">Proyectos</h1>
            <p className="section-copy">
              Proyectos lanzados y proyectos en desarrollo, con enfoque en ejecución premium,
              claridad comercial y detalle de producto digital.
            </p>
          </Reveal>
          <ProjectsExperience
            launchedProjects={launchedProjects}
            inProgressProjects={inProgressProjects}
          />
        </div>
      </section>
    </PublicPageShell>
  );
}
