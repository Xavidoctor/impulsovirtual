import { LEGAL_LAST_UPDATED } from "@/content/legal/shared";
import type { LegalDocument } from "@/content/legal/types";

export const terminosContent: LegalDocument = {
  slug: "terminos",
  title: "Términos y condiciones",
  description: "Condiciones de contratación y prestación de servicios de Impulso Virtual.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: "Servicios",
      paragraphs: [
        "Impulso Virtual ofrece servicios digitales, incluyendo desarrollo web, automatización, inteligencia artificial y soluciones tecnológicas.",
      ],
    },
    {
      heading: "Contratación",
      paragraphs: [
        "Las condiciones específicas de cada servicio se acordarán directamente con el cliente mediante presupuesto o contrato.",
      ],
    },
    {
      heading: "Precios",
      paragraphs: [
        "Los precios se definirán en cada propuesta y podrán variar según el alcance del proyecto.",
      ],
    },
    {
      heading: "Propiedad del trabajo",
      paragraphs: [
        "Una vez finalizado el proyecto y realizado el pago completo, el cliente dispondrá de los derechos acordados sobre el trabajo entregado.",
      ],
    },
    {
      heading: "Responsabilidad",
      paragraphs: [
        "Impulso Virtual no se responsabiliza de problemas derivados de modificaciones realizadas por terceros tras la entrega del proyecto.",
      ],
    },
    {
      heading: "Disponibilidad del servicio",
      paragraphs: [
        "No se garantiza disponibilidad ininterrumpida de los servicios digitales debido a factores técnicos externos.",
      ],
    },
    {
      heading: "Modificaciones",
      paragraphs: [
        "Impulso Virtual se reserva el derecho de modificar estos términos en cualquier momento.",
      ],
    },
  ],
};