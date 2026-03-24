"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COOKIE_PREFERENCES_COPY } from "@/content/legal/shared";
import type { CookieConsent, CookiePreferences } from "@/lib/cookies/consent";

type CookiePreferencesModalProps = {
  open: boolean;
  consent: CookieConsent | null;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
};

export function CookiePreferencesModal({
  open,
  consent,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: CookiePreferencesModalProps) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
  }, [consent, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;

    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );

    const initialFocus = focusables()[0];
    initialFocus?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#05080b]/86 p-4 md:items-center" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        className="w-full max-w-2xl premium-panel bg-[#0b1115]/94 backdrop-blur-xl p-5 md:p-7"
      >
        <div className="noise-overlay" />
        <div className="relative z-[1] space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 id="cookie-preferences-title" className="text-3xl font-display text-foreground">
                {COOKIE_PREFERENCES_COPY.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{COOKIE_PREFERENCES_COPY.description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de cookies"
              className="focus-ring rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-muted hover:text-foreground"
            >
              Cerrar
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {COOKIE_PREFERENCES_COPY.categories.necessary.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {COOKIE_PREFERENCES_COPY.categories.necessary.description}
                  </p>
                </div>
                <span className="rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-foreground">
                  Siempre activas
                </span>
              </div>
            </div>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {COOKIE_PREFERENCES_COPY.categories.analytics.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {COOKIE_PREFERENCES_COPY.categories.analytics.description}
                </p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-white/25 bg-[#0b1114] accent-accent"
                aria-label={COOKIE_PREFERENCES_COPY.categories.analytics.label}
              />
            </label>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {COOKIE_PREFERENCES_COPY.categories.marketing.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {COOKIE_PREFERENCES_COPY.categories.marketing.description}
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-white/25 bg-[#0b1114] accent-accent"
                aria-label={COOKIE_PREFERENCES_COPY.categories.marketing.label}
              />
            </label>
          </div>

          <Link href="/legal/cookies" className="focus-ring inline-flex text-xs uppercase tracking-[0.16em] text-muted underline decoration-white/30 underline-offset-4 hover:text-foreground">
            {COOKIE_PREFERENCES_COPY.policyLabel}
          </Link>

          <div className="flex flex-wrap gap-2.5 md:justify-end">
            <button type="button" onClick={() => onSave({ analytics, marketing })} className="focus-ring btn-primary">
              {COOKIE_PREFERENCES_COPY.saveLabel}
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-accent/28 bg-accent/10 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground hover:border-accent/45"
            >
              {COOKIE_PREFERENCES_COPY.acceptAllLabel}
            </button>
            <button
              type="button"
              onClick={onRejectAll}
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.02] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground hover:border-white/35 hover:bg-white/[0.06]"
            >
              {COOKIE_PREFERENCES_COPY.rejectAllLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
