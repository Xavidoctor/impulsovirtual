import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { servicePreviews } from "@/content/services";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { listPublishedServices } from "@/src/lib/domain/services";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/servicios");
  return {
    title: "Servicios",
    description:
      "Servicios digitales premium de estrategia, diseno web y automatizacion para empresas en crecimiento.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Servicios | ${site.brandName}`,
      description:
        "Servicios digitales premium de estrategia, diseno web y automatizacion para empresas en crecimiento.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function ServiciosPage() {
  const domainServices = await listPublishedServices();
  const services =
    domainServices.length > 0
      ? domainServices.map((service) => ({
          slug: service.slug,
          title: service.title,
          excerpt: service.short_description,
        }))
      : servicePreviews;

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-12">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Servicios</p>
            <h1 className="hero-title font-display">Servicios</h1>
            <p className="section-copy">
              Soluciones premium de estrategia, diseno web y sistemas digitales para transformar
              captacion y conversion.
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.slug} delay={index * 0.06}>
                <article className="premium-card elevate-hover h-full p-6">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
                    0{index + 1}
                  </p>
                  <h2 className="mt-3 text-2xl font-display text-foreground">
                  {service.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{service.excerpt}</p>
                  <Link href={`/servicios/${service.slug}`} className="focus-ring mt-6 lift-link">
                    Ver detalle
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
