import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { buildLegalMetadata } from "@/content/legal/metadata";
import { terminosContent } from "@/content/legal/terminos";

export const metadata: Metadata = buildLegalMetadata({
  title: "Términos y condiciones",
  description: terminosContent.description,
  path: "/legal/terminos",
});

export default function TerminosPage() {
  return (
    <LegalPageLayout
      title={terminosContent.title}
      lastUpdated={terminosContent.lastUpdated}
      currentPath="/legal/terminos"
    >
      <LegalContent document={terminosContent} />
    </LegalPageLayout>
  );
}