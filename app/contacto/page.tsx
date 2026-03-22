import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/contacto");
  return {
    title: "Contacto",
    description: "Canal directo para iniciar una conversacion con Impulso Virtual.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Contacto | ${site.brandName}`,
      description: "Canal directo para iniciar una conversacion con Impulso Virtual.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function ContactoPage() {
  const site = await getPublicSiteContext();

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-8">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Contacto</p>
            <h1 className="hero-title font-display leading-[0.95]">Hablemos de tu siguiente etapa digital</h1>
            <p className="section-copy max-w-2xl">
              Cuanto mas contexto compartas, mas precisa sera nuestra respuesta inicial.
              Normalmente respondemos en menos de 24h laborables.
            </p>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal>
              <aside className="premium-card space-y-6 p-6 md:p-7">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Canales directos</p>
                  <p className="text-sm text-foreground">{site.contact.email}</p>
                  {site.contact.phone ? <p className="text-sm text-muted">{site.contact.phone}</p> : null}
                  {site.contact.location ? (
                    <p className="text-sm text-muted">{site.contact.location}</p>
                  ) : null}
                </div>

                <div className="subtle-divider" />

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={site.contact.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring btn-secondary"
                  >
                    WhatsApp
                  </Link>
                  {site.contact.socials.map((social) => (
                    <Link
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring btn-secondary"
                    >
                      {social.label}
                    </Link>
                  ))}
                </div>

                <div className="subtle-divider" />

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Que ocurre despues</p>
                  <ul className="space-y-2 text-sm leading-relaxed text-muted">
                    <li>1. Revisamos tu contexto y objetivo principal.</li>
                    <li>2. Te damos una respuesta inicial con siguientes pasos.</li>
                    <li>3. Si encaja, agendamos una llamada de enfoque.</li>
                  </ul>
                </div>
              </aside>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="premium-panel p-6 md:p-8">
                <div className="noise-overlay" />
                <div className="relative z-[1]">
                  <ContactForm />
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="premium-card flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
              <p className="text-sm leading-relaxed text-muted">
                Si ya tienes alcance y presupuesto definidos, el formulario de propuesta acelera el
                proceso comercial.
              </p>
              <Link href="/solicitar-propuesta" className="focus-ring btn-primary">
                Ir a solicitar propuesta
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicPageShell>
  );
}
