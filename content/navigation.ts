export type PublicNavItem = {
  label: string;
  href: string;
};

export const publicNavigation: PublicNavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Sobre mí", href: "/sobre-mi" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
];

export const primaryCta = {
  label: "Solicitar propuesta",
  href: "/solicitar-propuesta",
};

export const secondaryCta = {
  label: "Ver servicios",
  href: "/servicios",
};

