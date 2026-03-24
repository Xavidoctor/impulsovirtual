import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { avisoLegalContent } from "@/content/legal/aviso-legal";
import { buildLegalMetadata } from "@/content/legal/metadata";

export const metadata: Metadata = buildLegalMetadata({
  title: "Aviso legal",
  description: avisoLegalContent.description,
  path: "/legal/aviso-legal",
});

export default function AvisoLegalPage() {
  return (
    <LegalPageLayout
      title={avisoLegalContent.title}
      lastUpdated={avisoLegalContent.lastUpdated}
      currentPath="/legal/aviso-legal"
    >
      <LegalContent document={avisoLegalContent} />
    </LegalPageLayout>
  );
}