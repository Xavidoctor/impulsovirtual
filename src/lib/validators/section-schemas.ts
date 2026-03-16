import { z } from "zod";

const mediaTypeSchema = z.enum(["image", "video"]);
const worksOrderingModeSchema = z.enum(["manual", "year_desc", "year_asc", "featured_first"]);

export const pageKeySchema = z.enum(["home", "works", "global"]);
export const sectionKeySchema = z.enum([
  "hero",
  "intro",
  "about",
  "expertises",
  "recent_works",
  "cta_final",
  "navbar",
  "footer",
  "works_listing_header",
  "featured_projects",
  "works_ordering",
  "showreel",
  "visual_gallery",
]);
export const sectionStatusSchema = z.enum(["draft", "published", "archived"]);

const linkItemSchema = z.object({
  label: z.string().trim().min(1).max(50),
  href: z.string().trim().min(1).max(240),
});

const imageItemSchema = z.object({
  src: z.string().trim().min(1).max(500),
  alt: z.string().trim().min(1).max(240),
});

const heroMediaSchema = z.object({
  type: mediaTypeSchema,
  videoSrc: z.string().trim().max(500).optional(),
  imageSrc: z.string().trim().max(500).optional(),
  posterSrc: z.string().trim().max(500).optional(),
  fallbackColor: z.string().trim().max(40).optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.4),
  playbackRate: z.number().min(0.25).max(2).default(0.85),
  loop: z.boolean().default(true),
});

export const heroSectionSchema = z.object({
  label: z.string().trim().min(2).max(120),
  marqueeText: z.string().trim().min(2).max(80),
  paragraph: z.string().trim().max(700),
  disciplines: z.array(z.string().trim().min(2).max(80)).min(1).max(12),
  media: heroMediaSchema,
});

const introSectionSchema = z.object({
  heading: z.string().trim().min(2).max(140),
  paragraph: z.string().trim().max(700),
});

const aboutSectionSchema = z.object({
  heading: z.string().trim().min(2).max(140),
  paragraphs: z.array(z.string().trim().min(2).max(1200)).min(1).max(12),
});

const expertisesSectionSchema = z.object({
  heading: z.string().trim().min(2).max(120),
  intro: z.string().trim().max(500),
  items: z.array(z.string().trim().min(2).max(80)).min(1).max(24),
});

export const recentWorksSectionSchema = z.object({
  heading: z.string().trim().min(2).max(120),
  intro: z.string().trim().max(500),
  showFeaturedOnly: z.boolean().default(true),
  limit: z.number().int().min(1).max(24).default(3),
});

const ctaFinalSectionSchema = z.object({
  heading: z.string().trim().min(2).max(160),
  paragraph: z.string().trim().max(300).optional(),
  ctaLabel: z.string().trim().min(2).max(80),
  ctaHref: z.string().trim().max(240),
});

const navbarSectionSchema = z.object({
  brand: z.string().trim().min(2).max(100),
  links: z.array(linkItemSchema).min(1).max(12),
  copyEmail: z.string().trim().max(50),
  contactWhatsapp: z.string().trim().max(80),
});

const footerSectionSchema = z.object({
  brandLine: z.string().trim().max(120),
  copyright: z.string().trim().min(4).max(240),
  links: z.array(linkItemSchema).max(12).optional(),
});

const worksListingHeaderSchema = z.object({
  heading: z.string().trim().min(2).max(140),
  intro: z.string().trim().max(500),
});

const featuredProjectsSectionSchema = z.object({
  heading: z.string().trim().max(120).optional(),
  projectSlugs: z.array(z.string().trim().min(2).max(120)).max(24),
});

const worksOrderingSectionSchema = z.object({
  mode: worksOrderingModeSchema,
  manualOrderSlugs: z.array(z.string().trim().min(2).max(120)).max(40).optional(),
});

const showreelSectionSchema = z.object({
  heading: z.string().trim().min(2).max(120),
  caption: z.string().trim().max(160),
  videoSrc: z.string().trim().min(1).max(500),
  posterSrc: z.string().trim().max(500).optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.24),
});

const visualGallerySectionSchema = z.object({
  heading: z.string().trim().min(2).max(120),
  images: z.array(imageItemSchema).min(1).max(24),
});

const dataSchemas = {
  hero: heroSectionSchema,
  intro: introSectionSchema,
  about: aboutSectionSchema,
  expertises: expertisesSectionSchema,
  recent_works: recentWorksSectionSchema,
  cta_final: ctaFinalSectionSchema,
  navbar: navbarSectionSchema,
  footer: footerSectionSchema,
  works_listing_header: worksListingHeaderSchema,
  featured_projects: featuredProjectsSectionSchema,
  works_ordering: worksOrderingSectionSchema,
  showreel: showreelSectionSchema,
  visual_gallery: visualGallerySectionSchema,
} as const;

export function parseSectionData(
  sectionKey: z.infer<typeof sectionKeySchema>,
  rawData: unknown,
) {
  return dataSchemas[sectionKey].parse(rawData);
}

export function createDefaultSectionData(sectionKey: z.infer<typeof sectionKeySchema>) {
  const defaults: Record<z.infer<typeof sectionKeySchema>, unknown> = {
    hero: {
      label: "Estudio creativo independiente",
      marqueeText: "NACHOMASDESIGN",
      paragraph:
        "Disenador de producto, artista 3D y disenador visual. Desarrollo imagen de producto y narrativa visual para marcas que buscan una direccion clara y contemporanea.",
      disciplines: ["Modelado 3D", "Diseno de producto", "Diseno grafico"],
      media: {
        type: "image",
        imageSrc: "/assets/hero-01.png",
        posterSrc: "/assets/hero-01.png",
        fallbackColor: "#0d0d0d",
        overlayOpacity: 0.4,
        playbackRate: 0.85,
        loop: true,
      },
    },
    intro: {
      heading: "Intro",
      paragraph: "Presentacion breve del estudio.",
    },
    about: {
      heading: "Sobre mi",
      paragraphs: ["Descripcion del enfoque creativo del estudio."],
    },
    expertises: {
      heading: "Especialidades",
      intro: "Capacidades principales del estudio.",
      items: ["Modelado 3D"],
    },
    recent_works: {
      heading: "Recent Works",
      intro: "Selecciones recientes de portfolio.",
      showFeaturedOnly: true,
      limit: 3,
    },
    cta_final: {
      heading: "Hablemos",
      paragraph: "Si tienes una idea, la podemos desarrollar.",
      ctaLabel: "Contactar",
      ctaHref: "/#contacto",
    },
    navbar: {
      brand: "Nacho Mas Design",
      links: [
        { label: "Home", href: "/" },
        { label: "About", href: "/#sobre-mi" },
        { label: "Works", href: "/works" },
      ],
      copyEmail: "Copy Email",
      contactWhatsapp: "Contact / WhatsApp",
    },
    footer: {
      brandLine: "Nacho Mas Design",
      copyright: "© 2026 Nacho Mas Design. Todos los derechos reservados.",
      links: [],
    },
    works_listing_header: {
      heading: "Works",
      intro: "Listado completo de proyectos de portfolio.",
    },
    featured_projects: {
      heading: "Featured",
      projectSlugs: [],
    },
    works_ordering: {
      mode: "manual",
      manualOrderSlugs: [],
    },
    showreel: {
      heading: "Selected Motion",
      caption: "CGI / Spatial Narratives",
      videoSrc: "/assets/video-02.mp4",
      posterSrc: "/assets/work-03.png",
      overlayOpacity: 0.24,
    },
    visual_gallery: {
      heading: "Galeria visual",
      images: [{ src: "/assets/work-01.png", alt: "Imagen de galeria" }],
    },
  };

  return defaults[sectionKey];
}

export const sectionUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  pageKey: pageKeySchema,
  sectionKey: sectionKeySchema,
  position: z.coerce.number().int().min(0).max(999).default(0),
  enabled: z.boolean().default(true),
  status: sectionStatusSchema.default("draft"),
  dataJson: z.unknown(),
});

export const sectionDeleteSchema = z.object({
  id: z.string().uuid(),
});
