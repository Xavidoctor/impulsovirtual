export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_CONSENT_STORAGE_KEY = "iv_cookie_consent_v1";
export const COOKIE_CONSENT_UPDATED_EVENT = "iv:cookie-consent-updated";
export const COOKIE_PREFERENCES_OPEN_EVENT = "iv:cookie-preferences-open";

function isBrowser() {
  return typeof window !== "undefined";
}

function parseCookieConsent(value: unknown): CookieConsent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CookieConsent>;

  if (typeof candidate.analytics !== "boolean") return null;
  if (typeof candidate.marketing !== "boolean") return null;
  if (typeof candidate.updatedAt !== "string" || !candidate.updatedAt.trim()) return null;

  return {
    necessary: true,
    analytics: candidate.analytics,
    marketing: candidate.marketing,
    updatedAt: candidate.updatedAt,
  };
}

function emitConsentUpdated(consent: CookieConsent | null) {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent<CookieConsent | null>(COOKIE_CONSENT_UPDATED_EVENT, {
      detail: consent,
    }),
  );
}

export function getCookieConsent(): CookieConsent | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parseCookieConsent(parsed);
  } catch {
    return null;
  }
}

export function setCookieConsent(preferences: CookiePreferences): CookieConsent {
  const nextConsent: CookieConsent = {
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    updatedAt: new Date().toISOString(),
  };

  if (isBrowser()) {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextConsent));
    emitConsentUpdated(nextConsent);
  }

  return nextConsent;
}

export function clearCookieConsent() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  emitConsentUpdated(null);
}

export function hasAnalyticsConsent() {
  return Boolean(getCookieConsent()?.analytics);
}

export function hasMarketingConsent() {
  return Boolean(getCookieConsent()?.marketing);
}

export function subscribeCookieConsent(listener: (consent: CookieConsent | null) => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handler = () => {
    listener(getCookieConsent());
  };

  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handler);
  return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handler);
}

export function openCookiePreferences() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_OPEN_EVENT));
}

export function subscribeCookiePreferencesOpen(listener: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  window.addEventListener(COOKIE_PREFERENCES_OPEN_EVENT, listener);
  return () => window.removeEventListener(COOKIE_PREFERENCES_OPEN_EVENT, listener);
}