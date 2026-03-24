import type { Metadata } from "next";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { listPublishedServices } from "@/src/lib/domain/services";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/solicitar-propuesta");
  return {
    title: "Solicitar propuesta",
    description: "Formulario de briefing para preparar una propuesta comercial adaptada a tu proyecto.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Solicitar propuesta | ${site.brandName}`,
      description:
        "Formulario de briefing para preparar una propuesta comercial adaptada a tu proyecto.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function SolicitarPropuestaPage() {
  const services = await listPublishedServices();
  const serviceOptions =
    services.length > 0
      ? services.map((service) => service.title)
      : ["Estrategia digital", "Diseño web premium", "Automatizaciones"];

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-8">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Briefing comercial</p>
            <h1 className="hero-title font-display leading-[0.95]">Solicitar propuesta</h1>
            <p className="section-copy max-w-3xl">
              Completa este briefing para preparar una propuesta alineada con objetivos,
              presupuesto y contexto real de tu negocio.
            </p>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <Reveal>
              <div className="premium-panel p-6 md:p-8">
                <div className="noise-overlay" />
                <div className="relative z-[1]">
                  <QuoteRequestForm serviceOptions={serviceOptions} />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.07}>
              <aside className="space-y-5">
                <article className="premium-card p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Qué evaluamos</p>
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                    <li>1. Objetivo comercial prioritario.</li>
                    <li>2. Alcance funcional y técnico inicial.</li>
                    <li>3. Orden recomendado de ejecución.</li>
                  </ul>
                </article>

                <article className="premium-card p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Entregable inicial</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Recibirás una orientación de alcance y un planteamiento de trabajo con timing,
                    fases y enfoque recomendado.
                  </p>
                </article>

                <article className="premium-card p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Prefieres contacto breve</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Si todavía no tienes todos los detalles, puedes usar el canal de contacto y te
                    ayudamos a definir el briefing.
                  </p>
                  <Link href="/contacto" className="focus-ring btn-secondary mt-5">
                    Ir a contacto
                  </Link>
                </article>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
