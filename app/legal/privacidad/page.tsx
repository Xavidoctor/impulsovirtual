import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { privacidadContent } from "@/content/legal/privacidad";
import { buildLegalMetadata } from "@/content/legal/metadata";

export const metadata: Metadata = buildLegalMetadata({
  title: "Política de privacidad",
  description: privacidadContent.description,
  path: "/legal/privacidad",
});

export default function PrivacidadPage() {
  return (
    <LegalPageLayout
      title={privacidadContent.title}
      lastUpdated={privacidadContent.lastUpdated}
      currentPath="/legal/privacidad"
    >
      <LegalContent document={privacidadContent} />
    </LegalPageLayout>
  );
}