import Link from "next/link";
import { LEGAL_PAGE_LINKS } from "@/content/legal/shared";

type LegalIndexLinksProps = {
  currentPath?: string;
};

export function LegalIndexLinks({ currentPath }: LegalIndexLinksProps) {
  return (
    <div className="premium-card p-5 md:p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Más información legal</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {LEGAL_PAGE_LINKS.map((link) => {
          const isCurrent = currentPath === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent ? "page" : undefined}
              className={`focus-ring rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                isCurrent
                  ? "border-accent/45 bg-accent/10 text-foreground"
                  : "border-white/14 text-muted hover:border-accent/35 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}