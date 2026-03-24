import { LEGAL_LAST_UPDATED } from "@/content/legal/shared";
import type { LegalDocument } from "@/content/legal/types";

export const privacidadContent: LegalDocument = {
  slug: "privacidad",
  title: "Política de privacidad",
  description: "Política de privacidad y tratamiento de datos personales en Impulso Virtual.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: "Responsable del tratamiento",
      paragraphs: [
        "Xavier Mestre Sánchez",
        "Email: info@impulsovirtual.es",
      ],
    },
    {
      heading: "Finalidad del tratamiento",
      paragraphs: [
        "Los datos personales recogidos a través de este sitio web serán utilizados para:",
      ],
      list: [
        "Atender solicitudes de información",
        "Gestionar servicios contratados",
        "Enviar comunicaciones comerciales relacionadas con nuestros servicios",
        "Mejorar la experiencia del usuario",
      ],
    },
    {
      heading: "Legitimación",
      paragraphs: [
        "La base legal para el tratamiento de los datos es el consentimiento del usuario al aceptar esta política.",
      ],
    },
    {
      heading: "Conservación de datos",
      paragraphs: [
        "Los datos se conservarán mientras exista una relación comercial o hasta que el usuario solicite su supresión.",
      ],
    },
    {
      heading: "Destinatarios",
      paragraphs: [
        "Los datos no se cederán a terceros salvo obligación legal o cuando sea necesario para la prestación del servicio (por ejemplo, herramientas tecnológicas como hosting o email).",
      ],
    },
    {
      heading: "Derechos del usuario",
      paragraphs: ["El usuario puede ejercer sus derechos de:"],
      list: [
        "Acceso",
        "Rectificación",
        "Supresión",
        "Limitación",
        "Oposición",
        "Portabilidad",
      ],
    },
    {
      heading: "Ejercicio de derechos",
      paragraphs: ["Enviando una solicitud a: info@impulsovirtual.es"],
    },
    {
      heading: "Seguridad",
      paragraphs: [
        "Impulso Virtual aplica las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos personales.",
      ],
    },
    {
      heading: "Menores",
      paragraphs: ["Este sitio web no está dirigido a menores de edad."],
    },
  ],
};