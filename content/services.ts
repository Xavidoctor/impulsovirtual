export type ServicePreview = {
  slug: string;
  title: string;
  excerpt: string;
};

export const servicePreviews: ServicePreview[] = [
  {
    slug: "estrategia-digital",
    title: "Estrategia Digital",
    excerpt: "Auditoria, posicionamiento y plan de crecimiento orientado a resultados."
  },
  {
    slug: "diseno-web-premium",
    title: "Diseno Web Premium",
    excerpt: "Webs de alto impacto visual y rendimiento para marcas exigentes."
  },
  {
    slug: "automatizaciones",
    title: "Automatizaciones",
    excerpt: "Procesos y embudos automatizados para escalar captacion y operaciones."
  }
];

export const serviceBySlug = (slug: string) =>
  servicePreviews.find((service) => service.slug === slug);
