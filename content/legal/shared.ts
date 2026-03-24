import type { LegalLink } from "@/content/legal/types";

export const LEGAL_LAST_UPDATED = "24 de marzo de 2026";

export const LEGAL_PAGE_LINKS: LegalLink[] = [
  { label: "Aviso legal", href: "/legal/aviso-legal" },
  { label: "Política de privacidad", href: "/legal/privacidad" },
  { label: "Política de cookies", href: "/legal/cookies" },
  { label: "Términos y condiciones", href: "/legal/terminos" },
];

export const COOKIE_BANNER_COPY = {
  message:
    "Utilizamos cookies propias y de terceros para el funcionamiento del sitio, analizar el tráfico y, en su caso, personalizar contenidos o campañas. Puedes aceptar, rechazar o configurar tus preferencias.",
  acceptLabel: "Aceptar",
  rejectLabel: "Rechazar",
  configureLabel: "Configurar",
} as const;

export const COOKIE_PREFERENCES_COPY = {
  title: "Preferencias de cookies",
  description:
    "Puedes decidir qué categorías de cookies permitir. Las cookies técnicas son necesarias para el funcionamiento del sitio y siempre estarán activas.",
  categories: {
    necessary: {
      label: "Técnicas",
      description: "Necesarias para el funcionamiento básico del sitio.",
    },
    analytics: {
      label: "Analíticas",
      description: "Nos ayudan a entender cómo se usa la web y mejorarla.",
    },
    marketing: {
      label: "Marketing",
      description:
        "Permiten medir campañas y mostrar comunicaciones más relevantes.",
    },
  },
  saveLabel: "Guardar preferencias",
  acceptAllLabel: "Aceptar todas",
  rejectAllLabel: "Rechazar todas",
  policyLabel: "Ver política de cookies",
  manageLabel: "Gestionar cookies",
} as const;