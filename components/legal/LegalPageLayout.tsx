import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { LegalIndexLinks } from "@/components/legal/LegalIndexLinks";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  currentPath: string;
  children: ReactNode;
};

export function LegalPageLayout({ title, lastUpdated, currentPath, children }: LegalPageLayoutProps) {
  return (
    <section className="section-padding pb-14">
      <div className="container-width">
        <div className="mx-auto max-w-4xl space-y-5 md:space-y-6">
          <Reveal>
            <header className="premium-panel p-6 md:p-8">
              <div className="noise-overlay" />
              <div className="relative z-[1] space-y-4">
                <p className="editorial-kicker">Información legal</p>
                <h1 className="text-4xl font-display leading-[0.96] text-foreground md:text-5xl">
                  {title}
                </h1>
                <p className="text-sm text-muted">Última actualización: {lastUpdated}</p>
              </div>
            </header>
          </Reveal>

          <Reveal delay={0.04}>
            <LegalIndexLinks currentPath={currentPath} />
          </Reveal>

          <Reveal delay={0.08}>{children}</Reveal>
        </div>
      </div>
    </section>
  );
}