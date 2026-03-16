import type { Metadata } from "next";
import { Antonio } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/content/site-content";
import { getPublicContent } from "@/src/lib/cms/public-content";

const antonio = Antonio({
  subsets: ["latin"],
  variable: "--font-antonio",
  weight: "700",
  display: "swap"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nachomasdesign.com";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicContent({ draftEnabled: false });
  const seoTitle = data.seoGlobal.title || data.content.metadata.title;
  const seoDescription = data.seoGlobal.description || data.content.metadata.description;
  const ogImage = data.seoGlobal.ogImage || "/og-cover.svg";

  return {
    metadataBase: new URL(siteUrl),
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: siteUrl,
      siteName: siteConfig.brandName,
      locale: "es_ES",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Portfolio de Nacho Mas Design",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
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
      <body className={`${antonio.variable} font-sans`}>{children}</body>
    </html>
  );
}
