import type { Metadata } from "next";
import { brandConfig, getCanonicalUrl } from "@/content/brand";

type LegalMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function buildLegalMetadata({ title, description, path }: LegalMetadataInput): Metadata {
  const canonical = getCanonicalUrl(path);

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${brandConfig.name}`,
      description,
      url: canonical,
      type: "article",
    },
  };
}