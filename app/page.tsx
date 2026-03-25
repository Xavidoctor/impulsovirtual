import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { FeaturedServicesInteractive } from "@/components/FeaturedServicesInteractive";
import { PublicPageShell } from "@/components/PublicPageShell";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { ProjectViewerTrigger } from "@/components/projects/ProjectViewerTrigger";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { homeSupportContent } from "@/content/home";
import { projects as fallbackProjects } from "@/content/projects";
import { listBlogPosts } from "@/src/lib/domain/blog";
import { listFaqs } from "@/src/lib/domain/faqs";
import { listProjects } from "@/src/lib/domain/projects";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { listFeaturedPublishedServices } from "@/src/lib/domain/services";
import { listPublishedTestimonials } from "@/src/lib/domain/testimonials";

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

function ProcessStepIcon({ index }: { index: number }) {
  const baseClass = "h-[18px] w-[18px]";

  switch (index) {
    case 0:
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.2 14.8 14.8 9.2l-1.9 5.7-3.7-.1z" />
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <rect x="5" y="5" width="14" height="5" rx="1.5" />
          <rect x="5" y="14" width="9" height="5" rx="1.5" />
          <path d="M16 14h3m-3 5h3" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M8.5 15.5c0-4.7 4.1-8.8 8.8-8.8-.1 4.7-4.1 8.8-8.8 8.8z" />
          <path d="m7.1 16.9-2.4 2.4m3.4-7.4-3.4 3.4m6.8 1.3 3.4 3.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 5.5v5h-5" />
          <path d="m7 12 3 3 7-7" />
        </svg>
      );
  }
}

function normalizeSpanishCopy(value: string) {
  return value
    .replace(/\bDiagnostico\b/g, "Diagnóstico")
    .replace(/\bdiagnostico\b/g, "diagnóstico")
    .replace(/\bconversion\b/g, "conversión")
    .replace(/\bConversion\b/g, "Conversión")
    .replace(/\bAutomatizacion\b/g, "Automatización")
    .replace(/\bautomatizacion\b/g, "automatización")
    .replace(/\bDiseno\b/g, "Diseño")
    .replace(/\bdiseno\b/g, "diseño");
}

export default async function HomePage() {
  const [site, featuredServices, projectsData, testimonialsData, faqsData, blogData] =
    await Promise.all([
      getPublicSiteContext(),
      listFeaturedPublishedServices(),
      listProjects({ includeUnpublished: false, includeMedia: true }),
      listPublishedTestimonials(),
      listFaqs({ includeUnpublished: false }),
      listBlogPosts({ includeUnpublished: false, limit: 3 }),
    ]);

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
          preview_mode: (project.previewMode === "image" ? "image" : "embed") as "embed" | "image",
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
    .slice(0, 3);

  const featuredInProgressProjects = [...normalizedProjects]
    .filter((project) => project.status === "in_progress")
    .sort((a, b) => (b.progress_percentage ?? 0) - (a.progress_percentage ?? 0))
    .slice(0, 3);

  const faqs = faqsData.slice(0, 5);
  const testimonials = testimonialsData;
  const posts = blogData.slice(0, 2);

  return (
    <PublicPageShell>
      <section className="home-hero-section section-padding pb-5 pt-5 md:pb-7 md:pt-7">
        <div className="container-width">
          <Reveal>
            <div className="premium-panel hero-glow-panel p-7 md:p-10 lg:p-12">
              <div className="hero-media-layer" aria-hidden>
                <video
                  className="hero-media-video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  poster="/assets/mockup3.png"
                >
                  <source src="/assets/video%20impulso%201.mp4" type="video/mp4" />
                </video>
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

      <section className="section-padding pb-11 pt-4 md:pb-14 md:pt-6">
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
                    Arquitectura visual coherente en escritorio y móvil, enfocada en conversión.
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding py-14 md:py-16">
        <div className="container-width space-y-8 md:space-y-10">
          <Reveal>
            <div className="services-architecture-header gap-5">
              <div className="space-y-4">
                <p className="editorial-kicker text-accent/90">SERVICIOS</p>
                <h2 className="section-title font-display">Servicios destacados</h2>
                <p className="section-copy max-w-3xl text-foreground/78">
                  Cada servicio conecta estrategia, diseño y sistemas para aumentar valor percibido
                  y rendimiento comercial.
                </p>
              </div>
              <Link href="/servicios" className="focus-ring services-architecture-cta">
                Ver servicios
              </Link>
            </div>
          </Reveal>

          {featuredServices.length > 0 ? (
            <FeaturedServicesInteractive services={featuredServices} />
          ) : (
            <Reveal>
              <div className="service-power-empty">
                Publica y marca servicios como destacados en el CMS para mostrarlos aquí.
              </div>
            </Reveal>
          )}

          <div className="services-principles-grid">
            {homeSupportContent.valueProps.map((item, index) => (
              <Reveal key={item.title} delay={0.06 + index * 0.05} y={14}>
                <article className="service-principle-card">
                  <p className="service-principle-index">Capacidad 0{index + 1}</p>
                  <h3 className="mt-2 text-[1.45rem] font-display leading-[1.06] text-foreground md:text-[1.65rem]">
                    {normalizeSpanishCopy(item.title)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/66 md:text-[15px]">
                    {normalizeSpanishCopy(item.description)}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding py-14">
        <div className="container-width space-y-8">
          <Reveal>
            <div className="process-heading space-y-4">
              <p className="editorial-kicker text-accent/90">METODOLOGÍA</p>
              <h2 className="section-title font-display">Proceso de trabajo</h2>
              <p className="section-copy max-w-3xl text-foreground/75">
                Un sistema de ejecución pensado para tomar decisiones con criterio, reducir
                incertidumbre y construir un activo digital que crece contigo.
              </p>
            </div>
          </Reveal>
          <div className="process-grid">
            {homeSupportContent.processSteps.map((step, index) => (
              <Reveal key={step.step} delay={index * 0.06}>
                <article className="process-card h-full p-6 md:p-7">
                  <span className="process-mobile-dot" aria-hidden />
                  <span className="process-ghost-number" aria-hidden>
                    {step.step}
                  </span>
                  <div className="relative z-[1] flex items-start">
                    <span className="process-icon">
                      <ProcessStepIcon index={index} />
                    </span>
                  </div>
                  <h3 className="relative z-[1] mt-5 text-2xl font-display text-foreground md:text-[2rem]">
                    {step.title}
                  </h3>
                  <p className="relative z-[1] mt-3 text-sm leading-relaxed text-muted md:text-[15px]">
                    {step.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding py-14">
        <div className="container-width space-y-8">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 className="section-title font-display">Casos destacados</h2>
            <Link href="/proyectos" className="focus-ring lift-link">
              Explorar proyectos
            </Link>
          </Reveal>

          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredLaunchedProjects.map((project, index) => {
                const image = project.cover_image_url || project.media?.[0]?.file_url || null;
                return (
                  <Reveal key={project.id} delay={index * 0.07}>
                    <article className="premium-card case-feature-card tap-feedback group relative flex h-full flex-col overflow-hidden">
                      <Link
                        href={`/proyectos/${project.slug}`}
                        aria-label={`Abrir caso completo de ${project.title}`}
                        className="focus-ring absolute inset-0 z-10 rounded-xl"
                      />
                      <div className="relative z-[1] h-52 overflow-hidden bg-gradient-to-br from-[#0f1519] to-[#0b1013]">
                        {image ? (
                          <img
                            src={image}
                            alt={project.title}
                            loading="lazy"
                            decoding="async"
                            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 95vw"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.14em] text-muted">
                            Vista previa no disponible
                          </div>
                        )}
                      </div>
                      <div className="relative z-[1] flex flex-1 flex-col gap-3 p-6">
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
                        <div className="flex-1 space-y-3">
                          <h3 className="text-3xl font-display text-foreground">{project.title}</h3>
                          <p className="text-sm leading-relaxed text-muted">
                            {project.excerpt || "Proyecto completado con foco en resultado de negocio."}
                          </p>
                        </div>
                        <div className="mt-auto flex items-center justify-end">
                          <ProjectViewerTrigger
                            project={project}
                            label="Abrir web"
                            className="focus-ring relative z-20 inline-flex min-h-9 items-center justify-center rounded-full border border-accent/35 bg-accentSoft px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-accent tap-feedback hover:border-accent/55"
                          />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={0.08}>
              <div className="premium-card p-6 md:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                      En desarrollo
                    </p>
                    <h3 className="text-2xl font-display text-foreground">
                      Proyectos en curso
                    </h3>
                  </div>
                  <Link href="/proyectos" className="focus-ring lift-link">
                    Ver todos los proyectos
                  </Link>
                </div>

                {featuredInProgressProjects.length > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {featuredInProgressProjects.map((project, index) => (
                      <Reveal key={project.id} delay={0.04 * index} y={14}>
                        <Link
                          href={`/proyectos/${project.slug}`}
                          aria-label={`Ver caso completo de ${project.title}`}
                          className="focus-ring tap-feedback group block h-full"
                        >
                          <article className="flex h-full flex-col space-y-3 rounded-xl border border-white/10 bg-white/[0.01] p-4 transition-colors duration-200 group-hover:border-white/20">
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
                            <p className="flex-1 text-xs leading-relaxed text-muted">
                              {project.progress_note || "Ejecución activa con avance continuo."}
                            </p>
                          </article>
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted">
                    Actualmente no hay proyectos en desarrollo destacados.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="section-padding py-14">
          <div className="container-width space-y-8">
            <Reveal>
              <div className="space-y-4">
                <p className="editorial-kicker text-accent/90">TESTIMONIOS</p>
                <h2 className="section-title font-display">Confianza real de clientes reales</h2>
              </div>
            </Reveal>
            <Reveal>
              <TestimonialsCarousel testimonials={testimonials} />
            </Reveal>
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section className="section-padding py-14">
          <div className="container-width space-y-8">
            <Reveal>
              <h2 className="section-title font-display">Preguntas frecuentes</h2>
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
              <h2 className="section-title font-display">Análisis</h2>
              <Link href="/blog" className="focus-ring lift-link">
                Ver blog
              </Link>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post, index) => (
                <Reveal key={post.id} delay={index * 0.07}>
                  <article className="premium-card elevate-hover tap-feedback h-full p-6">
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
