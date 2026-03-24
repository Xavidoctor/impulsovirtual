import Link from "next/link";
import { CookiePreferencesButton } from "@/components/cookies/CookiePreferencesButton";
import { Logo } from "@/components/Logo";

type FooterProps = {
  brandLine: string;
  copyright: string;
  socials: Array<{ label: string; href: string }>;
  navigationLinks: Array<{ label: string; href: string }>;
  legalLinks: Array<{ label: string; href: string }>;
};

export function Footer({
  brandLine,
  copyright,
  socials,
  navigationLinks,
  legalLinks,
}: FooterProps) {
  return (
    <footer className="pb-8 pt-8 md:pb-10 md:pt-12">
      <div className="container-width">
        <div className="premium-panel p-6 md:p-8">
          <div className="noise-overlay" />
          <div className="relative z-[1] flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="space-y-4">
              <Logo className="focus-ring inline-flex items-center" imageClassName="h-8 w-auto" />
              <p className="max-w-md text-sm leading-relaxed text-muted">
                {brandLine}. Estrategia, diseño y ejecución técnica para marcas que quieren crecer
                con una presencia digital de alto nivel.
              </p>
            </div>
            <div className="space-y-3 text-xs uppercase tracking-[0.16em] text-muted">
              <p className="text-[11px] tracking-[0.24em] text-foreground/75">Conecta</p>
              <div className="flex flex-wrap gap-3">
                {socials.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring rounded-full border border-white/12 px-3 py-2 hover:border-accent/35 hover:text-foreground"
                  >
                    {social.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-[1] mt-6 subtle-divider" />

          <div className="relative z-[1] mt-6 grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground/75">Navegación</p>
              <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-muted">
                {navigationLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="focus-ring hover:text-foreground">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground/75">Legal</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted">
                {legalLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="focus-ring hover:text-foreground">
                    {link.label}
                  </Link>
                ))}
                <CookiePreferencesButton className="focus-ring hover:text-foreground" />
              </div>
            </div>
          </div>

          <div className="relative z-[1] mt-6 subtle-divider" />

          <div className="relative z-[1] mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted">{copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
