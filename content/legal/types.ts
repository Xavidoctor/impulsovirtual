export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export type LegalDocument = {
  slug: "aviso-legal" | "privacidad" | "cookies" | "terminos";
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export type LegalLink = {
  label: string;
  href: string;
};