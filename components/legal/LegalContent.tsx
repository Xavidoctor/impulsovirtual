import type { LegalDocument } from "@/content/legal/types";
import { LegalSection } from "@/components/legal/LegalSection";

type LegalContentProps = {
  document: LegalDocument;
};

export function LegalContent({ document }: LegalContentProps) {
  return (
    <article className="premium-panel p-6 md:p-8">
      <div className="noise-overlay" />
      <div className="relative z-[1] space-y-5" aria-label={`Contenido de ${document.title}`}>
        {document.sections.map((section) => (
          <LegalSection
            key={`${document.slug}-${section.heading}`}
            heading={section.heading}
            paragraphs={section.paragraphs}
            list={section.list}
          />
        ))}
      </div>
    </article>
  );
}