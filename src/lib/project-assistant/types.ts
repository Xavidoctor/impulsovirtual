export const PROJECT_TYPE_VALUES = [
  "web corporativa",
  "landing page",
  "tienda online",
  "rediseño web",
  "automatización",
  "integración de IA",
  "app personalizada",
  "app interna",
  "panel interno",
  "videojuego 2D",
  "otro",
] as const;

export const URGENCY_VALUES = ["alta", "media", "baja", "desconocida"] as const;

export const TARGET_PLATFORM_VALUES = [
  "web",
  "móvil",
  "web y móvil",
  "escritorio",
  "campaña",
  "desconocida",
] as const;

export const QUALIFICATION_VALUES = ["low", "medium", "high"] as const;

export const COMMON_NEEDS = [
  "captación de leads",
  "integración de IA",
  "automatización",
  "reservas",
  "WhatsApp",
  "ecommerce",
  "pagos",
  "panel interno",
  "rediseño visual",
  "mejora de conversión",
  "soporte al cliente",
  "gestión interna",
  "app a medida",
  "sistema interno",
  "juego 2D para web, móvil o campaña",
  "monetización",
  "login y cuentas",
  "backend",
  "panel de administración",
  "otro",
] as const;

export type ProjectType = (typeof PROJECT_TYPE_VALUES)[number];
export type Urgency = (typeof URGENCY_VALUES)[number];
export type TargetPlatform = (typeof TARGET_PLATFORM_VALUES)[number];
export type QualificationLevel = (typeof QUALIFICATION_VALUES)[number];
export type CommonNeed = (typeof COMMON_NEEDS)[number];

export type ProjectAssistantChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type ProjectAssistantOutput = {
  message: string;
  project_type: ProjectType;
  detected_needs: string[];
  goal: string;
  urgency: Urgency;
  target_platform: TargetPlatform;
  needs_backend: boolean;
  qualification_level: QualificationLevel;
  interest_in_ai: boolean;
  interest_in_automation: boolean;
  ready_for_cta: boolean;
  lead_summary: string;
};

export const DEFAULT_PROJECT_ASSISTANT_OUTPUT: ProjectAssistantOutput = {
  message:
    "Soy tu asistente de proyecto con IA. Para orientarte bien, cuéntame qué quieres construir o mejorar ahora mismo.",
  project_type: "otro",
  detected_needs: [],
  goal: "Pendiente de definir",
  urgency: "desconocida",
  target_platform: "desconocida",
  needs_backend: false,
  qualification_level: "low",
  interest_in_ai: false,
  interest_in_automation: false,
  ready_for_cta: false,
  lead_summary: "Lead en fase inicial. Falta información para definir alcance y prioridad.",
};

export function projectTypeToService(projectType: ProjectType) {
  switch (projectType) {
    case "web corporativa":
    case "landing page":
    case "tienda online":
    case "rediseño web":
      return "Diseño web premium";
    case "automatización":
      return "Automatizaciones";
    case "integración de IA":
      return "Integración de IA";
    case "app personalizada":
    case "app interna":
    case "panel interno":
      return "Aplicación a medida";
    case "videojuego 2D":
      return "Videojuego 2D";
    default:
      return "Estrategia digital";
  }
}
