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
    title: "Nosotros",
    description:
      "Conoce el enfoque de Impulso Virtual como estudio digital premium enfocado en posicionamiento, conversión y crecimiento sostenible.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Nosotros | ${site.brandName}`,
      description:
        "Conoce el enfoque de Impulso Virtual como estudio digital premium enfocado en posicionamiento, conversión y crecimiento sostenible.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function SobreMiPage() {
  const site = await getPublicSiteContext();
  const studioSignals = [
    {
      title: "Dirección estratégica",
      description:
        "Trabajamos desde objetivos de negocio y contexto competitivo para priorizar decisiones con retorno real.",
    },
    {
      title: "Rigor de ejecución",
      description:
        "Cada entrega combina criterio visual, precisión técnica y control de calidad orientado a conversión.",
    },
    {
      title: "Impacto medible",
      description:
        "Diseñamos sistemas digitales preparados para sostener crecimiento con métricas, orden y escalabilidad.",
    },
  ];

  return (
    <PublicPageShell>
      <section className="section-padding studio-page-section pb-10 md:pb-14">
        <div className="container-width space-y-10 md:space-y-12">
          <Reveal className="studio-page-header space-y-4">
            <p className="editorial-kicker text-accent/90">ESTUDIO</p>
            <h1 className="hero-title font-display leading-[0.93]">Nosotros</h1>
            <p className="section-copy max-w-4xl text-foreground/78">{site.about.intro}</p>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Reveal>
              <article className="studio-manifest-panel p-7 md:p-9 lg:p-10">
                <div className="studio-manifest-grid" />
                <div className="relative z-[1] space-y-6">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent/90">
                    Manifiesto del estudio
                  </p>
                  <h2 className="text-4xl font-display leading-[0.95] text-foreground md:text-5xl">
                    No vendemos piezas sueltas. Diseñamos sistemas digitales premium con intención comercial.
                  </h2>
                  {site.about.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${paragraph.slice(0, 18)}-${index}`}
                      className="max-w-4xl text-[15px] leading-relaxed text-foreground/79 md:text-[16px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="studio-aside-stack">
                {studioSignals.map((item, index) => (
                  <article key={item.title} className="studio-aside-card p-5 md:p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-accent/85">
                      0{index + 1}
                    </p>
                    <h3 className="mt-2 text-[1.55rem] font-display leading-[1.05] text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/68 md:text-[15px]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal className="studio-principles-section space-y-6 pt-2">
            <div className="space-y-3">
              <p className="editorial-kicker text-accent/88">PRINCIPIOS</p>
              <h2 className="section-title font-display">Cómo trabajamos en el estudio</h2>
              <p className="section-copy max-w-4xl text-foreground/74">
                Un marco de decisión y ejecución pensado para sostener calidad premium, velocidad de despliegue y resultados medibles.
              </p>
            </div>

            <div className="studio-principles-shell">
              {site.about.pillars.map((pillar, index) => (
                <article key={pillar.title} className="studio-principle-item">
                  <p className="studio-principle-index">0{index + 1}</p>
                  <h3 className="mt-3 text-[1.7rem] font-display leading-[1.03] text-foreground md:text-[1.9rem]">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/68 md:text-[15px]">
                    {pillar.description}
                  </p>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal className="studio-final-cta-wrap">
            <div className="studio-final-cta p-8 md:p-10 lg:p-12">
              <div className="noise-overlay" />
              <div className="relative z-[1] space-y-6">
                <p className="editorial-kicker text-accent/90">SIGUIENTE ETAPA</p>
                <h2 className="section-title max-w-5xl font-display leading-[0.95]">
                  Construimos activos digitales que sostienen posicionamiento, conversión y crecimiento real.
                </h2>
                <p className="section-copy max-w-4xl text-foreground/76">
                  Si buscas un estudio que combine dirección estratégica, diseño premium y ejecución técnica con criterio comercial, podemos plantear tu siguiente fase con claridad.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/solicitar-propuesta" className="focus-ring btn-primary">
                    Solicitar propuesta
                  </Link>
                  <Link href="/contacto" className="focus-ring btn-secondary">
                    Hablar con el estudio
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
