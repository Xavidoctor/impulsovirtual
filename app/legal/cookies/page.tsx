import type { Metadata } from "next";
import { CookiePreferencesButton } from "@/components/cookies/CookiePreferencesButton";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { cookiesContent } from "@/content/legal/cookies";
import { buildLegalMetadata } from "@/content/legal/metadata";

export const metadata: Metadata = buildLegalMetadata({
  title: "Política de cookies",
  description: cookiesContent.description,
  path: "/legal/cookies",
});

export default function CookiesPolicyPage() {
  return (
    <LegalPageLayout
      title={cookiesContent.title}
      lastUpdated={cookiesContent.lastUpdated}
      currentPath="/legal/cookies"
    >
      <div className="space-y-4">
        <LegalContent document={cookiesContent} />

        <div className="premium-card flex flex-col items-start gap-3 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <p className="text-sm leading-relaxed text-muted">
            Puedes revisar o cambiar tu consentimiento en cualquier momento desde el panel de preferencias.
          </p>
          <CookiePreferencesButton className="focus-ring btn-secondary" />
        </div>
      </div>
    </LegalPageLayout>
  );
}