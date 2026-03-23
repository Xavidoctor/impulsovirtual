import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PublicPageShell } from "@/components/PublicPageShell";
import { ProjectViewerTrigger } from "@/components/projects/ProjectViewerTrigger";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { homeSupportContent } from "@/content/home";
import { projects as fallbackProjects } from "@/content/projects";
import { servicePreviews } from "@/content/services";
import { listBlogPosts } from "@/src/lib/domain/blog";
import { listFaqs } from "@/src/lib/domain/faqs";
import { listProjects } from "@/src/lib/domain/projects";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { listPublishedServices } from "@/src/lib/domain/services";
import { listTestimonials } from "@/src/lib/domain/testimonials";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/");

  return {
    alternates: {
      canonical,
    },
    openGraph: {
      url: canonical,
    },
  };
}

export default async function HomePage() {
  const [site, servicesData, projectsData, testimonialsData, faqsData, blogData] =
    await Promise.all([
      getPublicSiteContext(),
      listPublishedServices(),
      listProjects({ includeUnpublished: false, includeMedia: true }),
      listTestimonials({ includeUnpublished: false }),
      listFaqs({ includeUnpublished: false }),
      listBlogPosts({ includeUnpublished: false, limit: 3 }),
    ]);

  const featuredServices =
    servicesData.length > 0
      ? [...servicesData]
          .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order)
          .slice(0, 3)
      : servicePreviews.map((service, index) => ({
          id: service.slug,
          slug: service.slug,
          title: service.title,
          subtitle: null,
          short_description: service.excerpt,
          full_description: service.excerpt,
          cover_image_url: null,
          icon_name: null,
          featured: index < 2,
          sort_order: index + 1,
          is_published: true,
          seo_title: null,
          seo_description: null,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
        }));

  const normalizedProjects =
    projectsData.length > 0
      ? projectsData
      : fallbackProjects.map((project) => ({
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

  const featuredLaunchedProjects = [...normalizedProjects]
    .filter((project) => project.status === "completed")
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 2);

  const featuredInProgressProjects = [...normalizedProjects]
    .filter((project) => project.status === "in_progress")
    .sort((a, b) => (b.progress_percentage ?? 0) - (a.progress_percentage ?? 0))
    .slice(0, 3);

  const faqs = faqsData.slice(0, 5);
  const testimonials = testimonialsData.slice(0, 3);
  const posts = blogData.slice(0, 2);

  return (
    <PublicPageShell>
      <section className="section-padding pb-14 pt-8 md:pt-12">
        <div className="container-width">
          <Reveal>
            <div className="premium-panel hero-glow-panel p-7 md:p-10 lg:p-12">
              <div className="hero-media-layer" aria-hidden>
                <Image
                  src="/assets/mockup3.png"
                  alt="Composicion visual premium de Impulso Virtual"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="hero-visual-layer" aria-hidden>
                <span className="hero-aura-core" />
                <span className="hero-aura-orb" />
                <span className="hero-depth-lines" />
                <span className="hero-shine-sweep" />
              </div>
              <div className="relative z-[1] grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <p className="editorial-kicker text-foreground/75">{site.hero.label}</p>
                  <h1 className="hero-title max-w-5xl font-display leading-[0.95]">
                    {site.hero.title}
                  </h1>
                  <p className="section-copy max-w-2xl">{site.hero.subtitle}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={site.primaryCta.href} className="focus-ring btn-primary">
                      {homeSupportContent.heroPrimaryCtaLabel}
                    </Link>
                    <Link href={site.secondaryCta.href} className="focus-ring btn-secondary">
                      {homeSupportContent.heroSecondaryCtaLabel}
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="premium-card elevate-hover p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Posicionamiento</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      Arquitectura digital para marcas que venden valor, no precio.
                    </p>
                  </div>
                  <div className="premium-card elevate-hover p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Conversión</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      Diseño editorial con intención comercial y experiencia impecable.
                    </p>
                  </div>
                  <div className="premium-card elevate-hover p-4 sm:col-span-2 lg:col-span-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Escalabilidad</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      Sistemas y automatización listos para crecer sin fricción operativa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding py-12 md:py-16">
        <div className="container-width">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Reveal>
              <article className="premium-card landing-image-card">
                <div className="landing-image-frame aspect-[16/9]">
                  <Image
                    src="/assets/mockup2.png"
                    alt="Preview profesional de interfaz web en monitor ultrawide"
                    fill
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover object-center"
                  />
                </div>
                <div className="space-y-2 p-5 md:p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                    Diseño editorial premium
                  </p>
                  <h3 className="text-2xl font-display text-foreground md:text-3xl">
                    Experiencias web con presencia de marca y detalle visual
                  </h3>
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.06}>
              <article className="premium-card landing-image-card">
                <div className="landing-image-frame aspect-[16/9]">
                  <Image
                    src="/assets/Mockup1.png"
                    alt="Sistema visual multi-dispositivo para sitio premium"
                    fill
                    sizes="(min-width: 1024px) 38vw, 100vw"
                    className="object-cover object-center"
                  />
                </div>
                <div className="space-y-2 p-5 md:p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                    Sistema adaptativo
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Arquitectura visual coherente en desktop y mobile, enfocada en conversion.
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding py-14">
        <div className="container-width space-y-8">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 className="section-title font-display">Servicios Estratégicos</h2>
            <Link href="/servicios" className="focus-ring lift-link">
              Ver servicios
            </Link>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {featuredServices.map((service, index) => (
              <Reveal key={service.slug} delay={index * 0.06}>
                <article className="premium-card elevate-hover flex h-full flex-col p-6">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
                    0{index + 1}
                  </p>
                  <h3 className="mt-3 text-2xl font-display text-foreground">{service.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {service.short_description}
                  </p>
                  <Link href={`/servicios/${service.slug}`} className="focus-ring mt-6 lift-link">
                    Ver detalle
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding py-14">
        <div className="container-width grid gap-5 md:grid-cols-3">
          {homeSupportContent.valueProps.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.07}>
              <article className="premium-card elevate-hover h-full p-6">
                <h3 className="text-2xl font-display text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-padding py-14">
        <div className="container-width space-y-8">
          <Reveal>
            <h2 className="section-title font-display">Proceso De Trabajo</h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            {homeSupportContent.processSteps.map((step, index) => (
              <Reveal key={step.step} delay={index * 0.06}>
                <article className="premium-card elevate-hover h-full p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-accent">{step.step}</p>
                  <h3 className="mt-3 text-2xl font-display text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding py-14">
        <div className="container-width space-y-8">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 className="section-title font-display">Casos Destacados</h2>
            <Link href="/proyectos" className="focus-ring lift-link">
              Explorar proyectos
            </Link>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-5 md:grid-cols-2">
              {featuredLaunchedProjects.map((project, index) => {
                const image = project.cover_image_url || project.media?.[0]?.file_url || null;
                return (
                  <Reveal key={project.id} delay={index * 0.07}>
                    <article className="premium-card elevate-hover overflow-hidden">
                      {image ? (
                        <div className="h-52 overflow-hidden">
                          <img
                            src={image}
                            alt={project.title}
                            loading="lazy"
                            decoding="async"
                            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 95vw"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-3 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {project.company_logo_url ? (
                            <div className="flex h-9 w-[132px] items-center">
                              <img
                                src={project.company_logo_url}
                                alt={`Logo de ${project.title}`}
                                loading="lazy"
                                decoding="async"
                                className="max-h-8 w-auto max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                              {project.client_name || "Proyecto"}
                            </p>
                          )}
                          <span className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-200">
                            Completado
                          </span>
                        </div>
                        <h3 className="text-3xl font-display text-foreground">{project.title}</h3>
                        <p className="text-sm leading-relaxed text-muted">{project.excerpt}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em]">
                          <Link href={`/proyectos/${project.slug}`} className="focus-ring lift-link">
                            Ver caso completo
                          </Link>
                          <ProjectViewerTrigger
                            project={project}
                            label="Visualizar web"
                            className="focus-ring lift-link"
                          />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={0.08}>
              <aside className="premium-card h-full space-y-4 p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                  En desarrollo
                </p>
                <h3 className="text-2xl font-display text-foreground">
                  Proyectos en curso
                </h3>
                <div className="space-y-4">
                  {featuredInProgressProjects.length > 0 ? (
                    featuredInProgressProjects.map((project) => (
                      <div key={project.id} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.01] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{project.title}</p>
                          <span className="text-xs text-foreground/80">{project.progress_percentage ?? 0}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent/75 via-accent to-emerald-200/80"
                            style={{ width: `${project.progress_percentage ?? 0}%` }}
                          />
                        </div>
                        <p className="text-xs leading-relaxed text-muted">
                          {project.progress_note || "Ejecucion activa con avance continuo."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">
                      Actualmente no hay proyectos en desarrollo destacados.
                    </p>
                  )}
                </div>
                <Link href="/proyectos" className="focus-ring lift-link">
                  Ver todos los proyectos
                </Link>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="section-padding py-14">
          <div className="container-width space-y-8">
            <Reveal>
              <h2 className="section-title font-display">Testimonios</h2>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Reveal key={testimonial.id} delay={index * 0.07}>
                  <article className="premium-card elevate-hover h-full p-6">
                    <p className="text-lg leading-relaxed text-foreground/95">
                      “{testimonial.quote}”
                    </p>
                    <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted">
                      {testimonial.name}
                      {testimonial.role ? ` · ${testimonial.role}` : ""}
                      {testimonial.company ? ` · ${testimonial.company}` : ""}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section className="section-padding py-14">
          <div className="container-width space-y-8">
            <Reveal>
              <h2 className="section-title font-display">Preguntas Frecuentes</h2>
            </Reveal>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <Reveal key={faq.id} delay={index * 0.05}>
                  <details className="premium-card group p-5">
                    <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="section-padding py-14">
          <div className="container-width space-y-8">
            <Reveal className="flex items-end justify-between gap-4">
              <h2 className="section-title font-display">Insights</h2>
              <Link href="/blog" className="focus-ring lift-link">
                Ver blog
              </Link>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post, index) => (
                <Reveal key={post.id} delay={index * 0.07}>
                  <article className="premium-card elevate-hover h-full p-6">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {new Date(post.published_at ?? post.created_at).toLocaleDateString("es-ES")}
                    </p>
                    <h3 className="mt-3 text-2xl font-display text-foreground">{post.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="focus-ring mt-6 lift-link">
                      Leer artículo
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-padding pt-10">
        <div className="container-width">
          <Reveal>
            <div className="premium-panel p-7 md:p-10 lg:p-12">
              <div className="noise-overlay" />
              <div className="relative z-[1] space-y-6">
                <h2 className="max-w-4xl text-4xl font-display text-foreground md:text-6xl">
                  {homeSupportContent.finalCta.title}
                </h2>
                <p className="section-copy max-w-3xl">{homeSupportContent.finalCta.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/solicitar-propuesta" className="focus-ring btn-primary">
                    {homeSupportContent.finalCta.primaryLabel}
                  </Link>
                  <Link href="/contacto" className="focus-ring btn-secondary">
                    {homeSupportContent.finalCta.secondaryLabel}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicPageShell>
  );
}
