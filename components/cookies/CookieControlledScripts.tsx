"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import {
  getCookieConsent,
  subscribeCookieConsent,
  type CookieConsent,
} from "@/lib/cookies/consent";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_ID?.trim();
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

export function CookieControlledScripts() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(getCookieConsent());
    return subscribeCookieConsent(setConsent);
  }, []);

  const canLoadAnalytics = useMemo(
    () => Boolean(consent?.analytics && gaMeasurementId),
    [consent],
  );
  const canLoadMarketing = useMemo(
    () => Boolean(consent?.marketing && metaPixelId),
    [consent],
  );

  return (
    <>
      {canLoadAnalytics ? (
        <>
          <Script
            id="ga-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {canLoadMarketing ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}