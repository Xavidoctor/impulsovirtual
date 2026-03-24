import type { LegalSection as LegalSectionType } from "@/content/legal/types";

type LegalSectionProps = LegalSectionType;

export function LegalSection({ heading, paragraphs = [], list = [] }: LegalSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.015] p-5 md:p-6">
      <h2 className="text-2xl font-display text-foreground md:text-3xl">{heading}</h2>

      {paragraphs.length > 0 ? (
        <div className="space-y-3 text-sm leading-relaxed text-foreground/88 md:text-[15px]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {list.length > 0 ? (
        <ul className="space-y-2 pl-5 text-sm leading-relaxed text-foreground/88 marker:text-accent md:text-[15px]">
          {list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}