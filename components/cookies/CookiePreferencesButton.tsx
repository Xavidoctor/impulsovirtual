"use client";

import { COOKIE_PREFERENCES_COPY } from "@/content/legal/shared";
import { openCookiePreferences } from "@/lib/cookies/consent";

type CookiePreferencesButtonProps = {
  className?: string;
  label?: string;
};

export function CookiePreferencesButton({ className, label }: CookiePreferencesButtonProps) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={className}
      aria-label={label ?? COOKIE_PREFERENCES_COPY.manageLabel}
    >
      {label ?? COOKIE_PREFERENCES_COPY.manageLabel}
    </button>
  );
}