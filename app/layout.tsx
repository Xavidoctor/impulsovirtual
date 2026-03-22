import type { Metadata } from "next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "./globals.css";
import { brandConfig, getSiteUrl } from "@/content/brand";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const seoTitle = site.seo.title;
  const seoDescription = site.seo.description;
  const ogImage = site.seo.ogImage || brandConfig.ogImagePath;

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
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: brandConfig.logoPath, type: "image/png" },
      ],
      apple: brandConfig.logoPath,
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
        {children}
      </body>
    </html>
  );
}
