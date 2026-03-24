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
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(620px_380px_at_80%_12%,rgba(135,216,201,0.1),transparent_70%)]" />
      <div className="noise-overlay fixed inset-0 -z-10" />
      <Navbar
        links={site.navLinks}
        primaryCta={site.primaryCta}
      />
      <main className="pt-12 md:pt-20">{children}</main>
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
