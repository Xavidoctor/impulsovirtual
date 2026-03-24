"use client";

import { COOKIE_BANNER_COPY } from "@/content/legal/shared";

type CookieBannerProps = {
  onAccept: () => void;
  onReject: () => void;
  onConfigure: () => void;
};

export function CookieBanner({ onAccept, onReject, onConfigure }: CookieBannerProps) {
  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 pt-2 sm:px-6"
      role="region"
      aria-label="Banner de cookies"
    >
      <div className="mx-auto w-full max-w-5xl premium-panel px-4 py-4 sm:px-6 sm:py-5">
        <div className="noise-overlay" />
        <div className="relative z-[1] flex flex-col gap-4 sm:gap-5">
          <p className="text-sm leading-relaxed text-foreground/90">{COOKIE_BANNER_COPY.message}</p>

          <div className="flex flex-wrap gap-2.5 sm:justify-end">
            <button type="button" onClick={onAccept} className="focus-ring btn-primary">
              {COOKIE_BANNER_COPY.acceptLabel}
            </button>
            <button
              type="button"
              onClick={onReject}
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.02] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground hover:border-white/35 hover:bg-white/[0.06]"
            >
              {COOKIE_BANNER_COPY.rejectLabel}
            </button>
            <button
              type="button"
              onClick={onConfigure}
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-accent/28 bg-accent/10 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground hover:border-accent/45"
            >
              {COOKIE_BANNER_COPY.configureLabel}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
