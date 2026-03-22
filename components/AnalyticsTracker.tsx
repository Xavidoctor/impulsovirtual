"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sendEvent(payload: {
  eventType: "page_view" | "project_view" | "cta_click";
  path: string;
  value?: Record<string, unknown>;
}) {
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      pageTitle: document.title,
      referrer: document.referrer || undefined,
      utmSource: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
      utmMedium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
      utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
    }),
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const query =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).toString()
        : "";
    const path = query ? `${pathname}?${query}` : pathname;
    sendEvent({ eventType: "page_view", path });

    if (pathname.startsWith("/proyectos/") || pathname.startsWith("/works/")) {
      sendEvent({
        eventType: "project_view",
        path,
        value: { slug: pathname.split("/")[2] ?? null },
      });
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      const ctaTarget = event.target.closest("[data-cta]");
      if (!ctaTarget) return;
      const ctaName = ctaTarget.getAttribute("data-cta") ?? "cta";
      sendEvent({
        eventType: "cta_click",
        path: window.location.pathname,
        value: { cta: ctaName },
      });
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
