import { avisoLegalContent } from "@/content/legal/aviso-legal";
import { cookiesContent } from "@/content/legal/cookies";
import { privacidadContent } from "@/content/legal/privacidad";
import { terminosContent } from "@/content/legal/terminos";

export const legalDocuments = {
  avisoLegal: avisoLegalContent,
  privacidad: privacidadContent,
  cookies: cookiesContent,
  terminos: terminosContent,
} as const;