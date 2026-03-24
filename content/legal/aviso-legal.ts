import { LEGAL_LAST_UPDATED } from "@/content/legal/shared";
import type { LegalDocument } from "@/content/legal/types";

export const avisoLegalContent: LegalDocument = {
  slug: "aviso-legal",
  title: "Aviso legal",
  description: "Información legal y condiciones de uso del sitio web de Impulso Virtual.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: "Datos identificativos",
      list: [
        "Titular: Xavier Mestre Sánchez",
        "Nombre comercial: Impulso Virtual",
        "NIF: 53631450G",
        "Dirección: Temple San Telm 27, España",
        "Email: info@impulsovirtual.es",
        "Web: www.impulsovirtual.es",
      ],
    },
    {
      heading: "Objeto",
      paragraphs: [
        "El presente sitio web tiene como finalidad ofrecer servicios de desarrollo web, automatización, inteligencia artificial y soluciones digitales.",
      ],
    },
    {
      heading: "Condiciones de uso",
      paragraphs: [
        "El acceso y uso de este sitio web atribuye la condición de usuario, aceptando desde dicho acceso las presentes condiciones de uso.",
        "El usuario se compromete a hacer un uso adecuado de los contenidos y servicios ofrecidos.",
      ],
    },
    {
      heading: "Propiedad intelectual",
      paragraphs: [
        "Todos los contenidos del sitio web (diseño, textos, imágenes, código, logotipos, etc.) son propiedad de Impulso Virtual o cuentan con licencia, y están protegidos por la legislación vigente.",
        "Queda prohibida su reproducción, distribución o modificación sin autorización expresa.",
      ],
    },
    {
      heading: "Responsabilidad",
      paragraphs: [
        "Impulso Virtual no se hace responsable de los daños derivados del uso indebido del sitio web ni de posibles errores técnicos o interrupciones del servicio.",
      ],
    },
    {
      heading: "Enlaces externos",
      paragraphs: [
        "Este sitio web puede contener enlaces a sitios externos, sobre los cuales Impulso Virtual no tiene control ni asume responsabilidad.",
      ],
    },
  ],
};