export type ServicePreview = {
  slug: string;
  title: string;
  excerpt: string;
};

export const servicePreviews: ServicePreview[] = [
  {
    slug: "estrategia-digital",
    title: "Estrategia digital",
    excerpt: "Auditoría, posicionamiento y plan de crecimiento orientado a resultados."
  },
  {
    slug: "diseno-web-premium",
    title: "Diseño web premium",
    excerpt: "Webs de alto impacto visual y rendimiento para marcas exigentes."
  },
  {
    slug: "automatizaciones",
    title: "Automatizaciones",
    excerpt: "Procesos y embudos automatizados para escalar captación y operaciones."
  }
];

export const serviceBySlug = (slug: string) =>
  servicePreviews.find((service) => service.slug === slug);
