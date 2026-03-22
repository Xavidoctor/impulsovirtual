import "server-only";

import { aboutPageContent } from "@/content/about";
import { brandConfig } from "@/content/brand";
import { homeSupportContent } from "@/content/home";
import { primaryCta, publicNavigation, secondaryCta } from "@/content/navigation";
import { getSiteSettings } from "@/src/lib/domain/settings";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type PublicCta = {
  label: string;
  href: string;
};

type PublicSocial = {
  label: string;
  href: string;
};

export type PublicSiteContext = {
  brandName: string;
  navLinks: Array<{ label: string; href: string }>;
  primaryCta: PublicCta;
  secondaryCta: PublicCta;
  hero: {
    label: string;
    title: string;
    subtitle: string;
  };
  contact: {
    email: string;
    phone: string | null;
    location: string | null;
    whatsappUrl: string;
    socials: PublicSocial[];
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  footer: {
    brandLine: string;
    copyright: string;
  };
  about: typeof aboutPageContent;
};

function nonEmptyString(value: string | null | undefined, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function optionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getPublicSiteContext(
  supabase?: DomainSupabaseClient,
): Promise<PublicSiteContext> {
  const settings = await getSiteSettings(supabase);
  const brandName = nonEmptyString(settings?.business_name, brandConfig.name);
  const currentYear = new Date().getFullYear();

  const socials: PublicSocial[] = [];
  const linkedin = optionalString(settings?.linkedin_url);
  const instagram = optionalString(settings?.instagram_url);
  const behance = optionalString(settings?.behance_url);

  if (linkedin) {
    socials.push({ label: "LinkedIn", href: linkedin });
  }
  if (instagram) {
    socials.push({ label: "Instagram", href: instagram });
  }
  if (behance) {
    socials.push({ label: "Behance", href: behance });
  }

  const fallbackSocials = brandConfig.socials.map((item) => ({
    label: item.label,
    href: item.href,
  }));

  return {
    brandName,
    navLinks: publicNavigation,
    primaryCta: {
      label: nonEmptyString(settings?.hero_cta_primary, primaryCta.label),
      href: primaryCta.href,
    },
    secondaryCta: {
      label: nonEmptyString(settings?.hero_cta_secondary, secondaryCta.label),
      href: secondaryCta.href,
    },
    hero: {
      label: homeSupportContent.heroLabel,
      title: nonEmptyString(settings?.hero_title, homeSupportContent.heroTitleFallback),
      subtitle: nonEmptyString(settings?.hero_subtitle, homeSupportContent.heroSubtitleFallback),
    },
    contact: {
      email: nonEmptyString(settings?.contact_email, brandConfig.contact.email),
      phone: optionalString(settings?.contact_phone),
      location: optionalString(settings?.location),
      whatsappUrl: nonEmptyString(
        settings?.whatsapp_url,
        `https://wa.me/${brandConfig.contact.whatsappNumber}`,
      ),
      socials: socials.length ? socials : fallbackSocials,
    },
    seo: {
      title: nonEmptyString(settings?.default_seo_title, brandConfig.metadata.title),
      description: nonEmptyString(
        settings?.default_seo_description,
        brandConfig.metadata.description,
      ),
      ogImage: nonEmptyString(settings?.default_og_image_url, brandConfig.ogImagePath),
    },
    footer: {
      brandLine: brandName,
      copyright: `© ${currentYear} ${brandName}. Todos los derechos reservados.`,
    },
    about: aboutPageContent,
  };
}
