import { LEGAL_LAST_UPDATED } from "@/content/legal/shared";
import type { LegalDocument } from "@/content/legal/types";

export const cookiesContent: LegalDocument = {
  slug: "cookies",
  title: "Política de cookies",
  description: "Información sobre el uso y configuración de cookies en la web de Impulso Virtual.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: "Uso de cookies",
      paragraphs: [
        "En este sitio web utilizamos cookies para mejorar la experiencia del usuario y analizar el tráfico.",
      ],
    },
    {
      heading: "¿Qué son las cookies?",
      paragraphs: [
        "Las cookies son pequeños archivos que se almacenan en el dispositivo del usuario y permiten recordar información sobre su navegación.",
      ],
    },
    {
      heading: "Tipos de cookies utilizadas",
      list: [
        "Cookies técnicas: necesarias para el funcionamiento de la web",
        "Cookies de análisis: permiten analizar el comportamiento de los usuarios (ej: Google Analytics)",
        "Cookies publicitarias: pueden utilizarse para mostrar anuncios personalizados",
      ],
    },
    {
      heading: "Cookies de terceros",
      paragraphs: ["Este sitio web puede utilizar servicios de terceros como:"],
      list: ["Google Analytics", "Meta (Facebook/Instagram Ads)"],
    },
    {
      heading: "Gestión de cookies",
      paragraphs: [
        "El usuario puede aceptar, rechazar o configurar las cookies desde el banner mostrado al acceder a la web.",
        "También puede eliminar o bloquear las cookies desde su navegador.",
      ],
    },
    {
      heading: "Consentimiento",
      paragraphs: [
        "El uso de cookies no necesarias se realiza únicamente con el consentimiento del usuario.",
      ],
    },
  ],
};