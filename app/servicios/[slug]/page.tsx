import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { serviceBySlug, servicePreviews } from "@/content/services";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { getServiceBySlug, listPublishedServices } from "@/src/lib/domain/services";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const domainServices = await listPublishedServices();
  if (domainServices.length > 0) {
    return domainServices.map((service) => ({ slug: service.slug }));
  }

  return servicePreviews.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = getCanonicalUrl(`/servicios/${slug}`);
  const service = (await getServiceBySlug(slug)) ?? serviceBySlug(slug);
  const site = await getPublicSiteContext();

  if (!service) {
    return {
      title: "Servicio no encontrado",
      alternates: {
        canonical,
      },
    };
  }

  const description =
    "short_description" in service ? service.short_description : service.excerpt;

  return {
    title: service.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${service.title} | ${site.brandName}`,
      description,
      images:
        "cover_image_url" in service && service.cover_image_url
          ? [service.cover_image_url]
          : [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function ServicioDetallePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const domainService = await getServiceBySlug(slug);
  const fallbackService = serviceBySlug(slug);
  const service =
    domainService ??
    (fallbackService
      ? {
          title: fallbackService.title,
          short_description: fallbackService.excerpt,
          full_description: fallbackService.excerpt,
        }
      : null);

  if (!service) notFound();

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-8">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Servicio</p>
            <h1 className="hero-title font-display">{service.title}</h1>
            {"subtitle" in service && service.subtitle ? (
              <p className="text-sm tracking-[0.12em] text-accent">{service.subtitle}</p>
            ) : null}
            <p className="section-copy">{service.short_description}</p>
          </Reveal>

          <Reveal>
            <div className="premium-card p-6 text-sm leading-relaxed text-muted md:p-7">
              {service.full_description}
            </div>
          </Reveal>

          <Reveal className="flex flex-wrap gap-3 border-t border-border pt-6">
            <Link href="/solicitar-propuesta" className="focus-ring btn-primary">
              Solicitar propuesta
            </Link>
            <Link href="/contacto" className="focus-ring btn-secondary">
              Hablar con el estudio
            </Link>
          </Reveal>
        </div>
      </section>
    </PublicPageShell>
  );
}
