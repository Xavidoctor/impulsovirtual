import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/sobre-mi");
  return {
    title: "Sobre Mi",
    description:
      "Conoce el enfoque de Impulso Virtual para construir presencia digital premium y crecimiento sostenible.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Sobre Mi | ${site.brandName}`,
      description:
        "Conoce el enfoque de Impulso Virtual para construir presencia digital premium y crecimiento sostenible.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function SobreMiPage() {
  const site = await getPublicSiteContext();

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-10">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Estudio</p>
            <h1 className="hero-title font-display leading-[0.94]">Sobre Impulso Virtual</h1>
            <p className="section-copy">{site.about.intro}</p>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[1.06fr_0.94fr]">
            <Reveal>
              <article className="premium-panel p-7 md:p-9">
                <div className="noise-overlay" />
                <div className="relative z-[1] space-y-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                    Enfoque
                  </p>
                  {site.about.paragraphs.map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 18)}-${index}`} className="text-base leading-relaxed text-foreground/88">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <article className="premium-card p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Direccion</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Estrategia, experiencia y tecnologia alineadas para mover resultados de negocio.
                  </p>
                </article>
                <article className="premium-card p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Metodo</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Diagnostico claro, ejecucion precisa y mejoras continuas con criterio comercial.
                  </p>
                </article>
                <article className="premium-card p-5 sm:col-span-2 lg:col-span-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Resultado</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Ecosistemas digitales premium para captar demanda cualificada y escalar con orden.
                  </p>
                </article>
              </div>
            </Reveal>
          </div>

          <Reveal className="space-y-6 border-t border-border pt-10">
            <h2 className="section-title font-display">Principios de trabajo</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {site.about.pillars.map((pillar, index) => (
                <article key={pillar.title} className="premium-card elevate-hover h-full p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">0{index + 1}</p>
                  <h3 className="mt-3 text-2xl font-display text-foreground">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.description}</p>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="premium-panel p-8 md:p-10">
              <div className="noise-overlay" />
              <div className="relative z-[1] space-y-5">
                <h2 className="section-title max-w-4xl font-display">Construimos activos digitales que venden valor real</h2>
                <p className="section-copy max-w-3xl">
                  Si quieres pasar de una web correcta a una plataforma que eleve percepcion,
                  conversion y operacion, podemos definir la siguiente etapa juntos.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/solicitar-propuesta" className="focus-ring btn-primary">
                    Solicitar propuesta
                  </Link>
                  <Link href="/contacto" className="focus-ring btn-secondary">
                    Contacto directo
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
