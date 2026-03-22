import type { SiteContent } from "@/types/content";
import { contentEs } from "@/content/site-content";
import { brandConfig } from "@/content/brand";

// Placeholder de estructura para futura traduccion completa.
export const contentEn: SiteContent = {
  ...contentEs,
  metadata: {
    title: `${brandConfig.name} | Premium digital services`,
    description:
      "Premium digital studio focused on strategy, web experiences and growth systems for modern brands."
  }
};
