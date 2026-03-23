export const brandConfig = {
  name: "Impulso Virtual",
  domain: "impulsovirtual.com",
  locale: "es",
  localeTag: "es_ES",
  defaultSiteUrl: "https://impulsovirtual.com",
  logoPath: "/brand/impulso-virtual-logo.png",
  squareLogoPath: "/brand/logo-cuadrado-impulso.png",
  ogImagePath: "/assets/Mockup1.png",
  metadata: {
    title: "Impulso Virtual | Servicios digitales premium",
    description:
      "Impulso Virtual impulsa marcas con estrategia digital, diseno web premium y automatizaciones para crecer con claridad."
  },
  contact: {
    email: "hola@impulsovirtual.com",
    whatsappNumber: "34650304969",
    whatsappPrefilledMessage:
      "Hola equipo de Impulso Virtual, quiero hablar sobre servicios digitales para mi proyecto."
  },
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/impulso-virtual" },
    { label: "Instagram", href: "https://www.instagram.com/impulsovirtual" }
  ]
} as const;

function normalizeSiteUrl(rawValue: string | undefined) {
  const fallback = brandConfig.defaultSiteUrl;
  const value = (rawValue ?? "").trim();
  if (!value) return fallback;

  try {
    const normalized = value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
    return new URL(normalized).origin;
  } catch {
    return fallback;
  }
}

export const getSiteUrl = () => normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const getCanonicalUrl = (pathname = "/") => {
  const siteUrl = getSiteUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, `${siteUrl}/`).toString();
};
