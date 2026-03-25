import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProjectAssistantWidget } from "@/components/ProjectAssistantWidget";
import { LEGAL_PAGE_LINKS } from "@/content/legal/shared";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";

type PublicPageShellProps = {
  children: ReactNode;
};

export async function PublicPageShell({ children }: PublicPageShellProps) {
  const site = await getPublicSiteContext();

  return (
    <div className="site-shell relative min-h-screen overflow-x-clip">
      <div aria-hidden className="site-backdrop site-backdrop-base" />
      <div aria-hidden className="site-backdrop site-backdrop-grid" />
      <div aria-hidden className="site-backdrop site-backdrop-glow" />
      <div aria-hidden className="site-backdrop site-backdrop-top" />
      <div aria-hidden className="site-backdrop site-backdrop-flow" />
      <div aria-hidden className="site-backdrop site-backdrop-haze site-backdrop-motion-a" />
      <div aria-hidden className="site-backdrop site-backdrop-haze site-backdrop-motion-b" />
      <div aria-hidden className="site-backdrop site-backdrop-noise noise-overlay" />
      <Navbar
        links={site.navLinks}
        primaryCta={site.primaryCta}
      />
      <main className="relative z-[1] pt-[74px] md:pt-[92px]">{children}</main>
      <ProjectAssistantWidget />
      <Footer
        brandLine={site.footer.brandLine}
        copyright={site.footer.copyright}
        socials={site.contact.socials}
        navigationLinks={site.navLinks}
        legalLinks={LEGAL_PAGE_LINKS}
      />
    </div>
  );
}
