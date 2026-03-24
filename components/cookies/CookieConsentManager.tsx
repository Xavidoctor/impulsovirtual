"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import { CookiePreferencesModal } from "@/components/cookies/CookiePreferencesModal";
import {
  getCookieConsent,
  setCookieConsent,
  subscribeCookieConsent,
  subscribeCookiePreferencesOpen,
  type CookieConsent,
  type CookiePreferences,
} from "@/lib/cookies/consent";
import { usePathname } from "next/navigation";

export function CookieConsentManager() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setConsent(getCookieConsent());
    setReady(true);

    const unsubscribeConsent = subscribeCookieConsent(setConsent);
    const unsubscribePreferences = subscribeCookiePreferencesOpen(() => setPreferencesOpen(true));

    return () => {
      unsubscribeConsent();
      unsubscribePreferences();
    };
  }, []);

  const handleAccept = useCallback(() => {
    const nextConsent = setCookieConsent({ analytics: true, marketing: true });
    setConsent(nextConsent);
    setPreferencesOpen(false);
  }, []);

  const handleReject = useCallback(() => {
    const nextConsent = setCookieConsent({ analytics: false, marketing: false });
    setConsent(nextConsent);
    setPreferencesOpen(false);
  }, []);

  const handleSavePreferences = useCallback((preferences: CookiePreferences) => {
    const nextConsent = setCookieConsent(preferences);
    setConsent(nextConsent);
    setPreferencesOpen(false);
  }, []);

  const hideForAdmin = useMemo(() => pathname?.startsWith("/admin"), [pathname]);

  if (hideForAdmin) return null;

  const shouldShowBanner = ready && !consent && !preferencesOpen;

  return (
    <>
      {shouldShowBanner ? (
        <CookieBanner
          onAccept={handleAccept}
          onReject={handleReject}
          onConfigure={() => setPreferencesOpen(true)}
        />
      ) : null}

      <CookiePreferencesModal
        open={preferencesOpen}
        consent={consent}
        onClose={() => setPreferencesOpen(false)}
        onSave={handleSavePreferences}
        onAcceptAll={handleAccept}
        onRejectAll={handleReject}
      />
    </>
  );
}