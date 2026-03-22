import { brandConfig } from "@/content/brand";
import { WHATSAPP_PREFILLED_MESSAGE } from "@/lib/constants";
import type { SiteContent } from "@/types/content";

export const siteConfig = {
  domain: brandConfig.domain,
  brandName: brandConfig.name,
  locale: brandConfig.locale,
  logoPath: brandConfig.logoPath,
  whatsappNumber: brandConfig.contact.whatsappNumber
} as const;

export const getWhatsappUrl = () => {
  const text = encodeURIComponent(WHATSAPP_PREFILLED_MESSAGE);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
};

export const contentEs: SiteContent = {
  metadata: {
    title: brandConfig.metadata.title,
    description: brandConfig.metadata.description
  },
  nav: {
    brand: brandConfig.name,
    links: [
      { label: "Home", href: "/" },
      { label: "Servicios", href: "/servicios" },
      { label: "Proyectos", href: "/proyectos" },
      { label: "Blog", href: "/blog" }
    ],
    copyEmail: "Copiar email",
    contactWhatsapp: "Contacto / WhatsApp"
  },
  hero: {
    label: "Estudio digital premium",
    marqueeText: "IMPULSO VIRTUAL",
    paragraph:
      "Impulsamos marcas con estrategia digital, diseno web y sistemas de automatizacion enfocados en conversion, posicionamiento y crecimiento sostenible.",
    disciplines: ["Estrategia digital", "Diseno web premium", "Automatizacion y embudos"],
    media: {
      type: "video",
      videoSrc: "/assets/video-01.mp4",
      imageSrc: "/assets/hero-01.png",
      posterSrc: "/assets/hero-01.png",
      fallbackColor: "#0d0d0d",
      overlayOpacity: 0.4
    }
  },
  works: {
    homeHeading: "Casos seleccionados",
    homeIntro: "Proyectos recientes en posicionamiento digital, experiencia web y crecimiento de negocio.",
    pageHeading: "Proyectos",
    pageIntro: "Listado completo de proyectos y ejecuciones digitales."
  },
  showreel: {
    heading: "Resultados en movimiento",
    caption: "Estrategia / Web / Automatizacion",
    videoSrc: "/assets/video-02.mp4",
    posterSrc: "/assets/work-03.png",
    overlayOpacity: 0.24
  },
  aboutStudio: {
    heading: "Sobre Impulso Virtual",
    paragraphs: [
      "Impulso Virtual es un estudio enfocado en servicios digitales de alto impacto para marcas y negocios en crecimiento.",
      "Cada proyecto integra estrategia, diseno y ejecucion para transformar objetivos comerciales en experiencias digitales medibles.",
      "Trabajamos con equipos que valoran claridad, velocidad de implementacion y una presencia digital premium."
    ]
  },
  expertise: {
    heading: "Especialidades",
    intro: "Capacidades para empresas que quieren escalar su presencia digital con una base solida.",
    items: [
      "Estrategia digital",
      "Diseno web",
      "Conversion y CRO",
      "Direccion creativa",
      "Branding",
      "Automatizaciones",
      "Email marketing",
      "Sistemas de captacion"
    ]
  },
  gallery: {
    heading: "Galeria visual",
    images: [
      { src: "/assets/work-01.png", alt: "Lampara blanca junto a sofa azul" },
      { src: "/assets/work-02.png", alt: "Interior minimal frente al mar" },
      { src: "/assets/work-03.png", alt: "Pabellon organico en playa exterior" },
      { src: "/assets/renders/ARCH3.png", alt: "Interior de pabellon organico" },
      { src: "/assets/renders/ARCH4.png", alt: "Arquitectura minimal sobre el agua" }
    ]
  },
  contact: {
    heading: "Contacto",
    intro: "Si quieres transformar tu presencia digital, escribenos y definimos el siguiente paso.",
    email: brandConfig.contact.email,
    contactLabel: "Enviar email",
    copyEmail: "Copiar email",
    whatsappLabel: "Contactar por WhatsApp",
    socials: [...brandConfig.socials]
  },
  footer: {
    brandLine: brandConfig.name,
    copyright: `© 2026 ${brandConfig.name}. Todos los derechos reservados.`
  }
};

export const getContentByLocale = (locale: string = siteConfig.locale): SiteContent => {
  if (locale === "es") return contentEs;
  return contentEs;
};
