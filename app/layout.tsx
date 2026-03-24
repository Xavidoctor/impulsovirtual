import type { Metadata } from "next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { CookieConsentManager } from "@/components/cookies/CookieConsentManager";
import { CookieControlledScripts } from "@/components/cookies/CookieControlledScripts";
import "./globals.css";
import { brandConfig, getSiteUrl } from "@/content/brand";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const seoTitle = site.seo.title;
  const seoDescription = site.seo.description;
  const ogImage =
    site.seo.ogImage && site.seo.ogImage !== "/og-cover.svg"
      ? site.seo.ogImage
      : brandConfig.ogImagePath;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seoTitle,
      template: `%s | ${site.brandName}`,
    },
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: siteUrl,
      siteName: site.brandName,
      locale: brandConfig.localeTag,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${site.brandName} - ${seoDescription}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
    },
    icons: {
      icon: [
        { url: brandConfig.squareLogoPath, type: "image/png" },
      ],
      shortcut: [brandConfig.squareLogoPath],
      apple: brandConfig.squareLogoPath,
    },
  };
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans">
        <AnalyticsTracker />
        <CookieControlledScripts />
        {children}
        <CookieConsentManager />
      </body>
    </html>
  );
}
