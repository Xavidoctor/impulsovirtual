export type BlogPreview = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
};

export const blogPreviews: BlogPreview[] = [
  {
    slug: "como-escalar-presencia-digital-premium",
    title: "Como escalar una presencia digital premium en 2026",
    excerpt:
      "Framework practico para combinar marca, conversion y experiencia digital sin perder coherencia.",
    publishedAt: "2026-03-01"
  },
  {
    slug: "errores-comunes-en-webs-de-servicios",
    title: "Errores comunes en webs de servicios de alto valor",
    excerpt:
      "Patrones que frenan leads cualificados y como corregirlos con una arquitectura mas clara.",
    publishedAt: "2026-02-20"
  }
];

export const blogPostBySlug = (slug: string) =>
  blogPreviews.find((post) => post.slug === slug);
