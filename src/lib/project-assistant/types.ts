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
export const CONVERSATION_PHASE_VALUES = [
  "discovering",
  "qualifying",
  "ready_for_cta",
] as const;
export const CURRENT_SITUATION_VALUES = ["desde_cero", "ya_tengo_algo"] as const;
export const SLOT_STATUS_VALUES = [
  "filled",
  "missing",
  "explicitly_negative",
  "not_asked",
] as const;
export const QUESTION_KEY_VALUES = [
  "ask_project_type",
  "ask_project_goal",
  "ask_conversion_focus",
  "ask_existing_site",
  "ask_platform",
  "ask_budget_or_urgency",
  "ask_backend_or_panel",
  "ask_integrations",
  "ask_automation_or_ai",
] as const;

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
export type ConversationPhase = (typeof CONVERSATION_PHASE_VALUES)[number];
export type CurrentSituation = (typeof CURRENT_SITUATION_VALUES)[number];
export type SlotStatus = (typeof SLOT_STATUS_VALUES)[number];
export type QuestionKey = (typeof QUESTION_KEY_VALUES)[number];

export type ProjectAssistantChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type ProjectAssistantCollectedData = {
  projectType: ProjectType | null;
  mainGoal: string | null;
  featuresNeeded: string[];
  currentSituation: CurrentSituation | null;
  targetPlatform: TargetPlatform | null;
  urgency: Urgency | null;
  needsBackend: boolean | null;
  needsAdminPanel: boolean | null;
  integrations: string[];
  aiInterest: boolean | null;
  automationInterest: boolean | null;
};

export type ProjectAssistantSlotStatus = {
  projectType: SlotStatus;
  mainGoal: SlotStatus;
  featuresNeeded: SlotStatus;
  currentSituation: SlotStatus;
  targetPlatform: SlotStatus;
  urgency: SlotStatus;
  needsBackend: SlotStatus;
  needsAdminPanel: SlotStatus;
  integrations: SlotStatus;
  aiInterest: SlotStatus;
  automationInterest: SlotStatus;
};

export type ProjectAssistantOutput = {
  message: string;
  project_type: ProjectType | null;
  detected_needs: string[];
  goal: string | null;
  current_situation: CurrentSituation | null;
  urgency: Urgency | null;
  target_platform: TargetPlatform | null;
  needs_backend: boolean | null;
  needs_admin_panel: boolean | null;
  integrations: string[];
  qualification_level: QualificationLevel | null;
  interest_in_ai: boolean | null;
  interest_in_automation: boolean | null;
  ready_for_cta: boolean;
  lead_summary: string | null;
  conversation_phase: ConversationPhase;
  collected_data: ProjectAssistantCollectedData;
  slot_status: ProjectAssistantSlotStatus;
  missing_critical_fields: string[];
  should_ask_follow_up: boolean;
  follow_up_questions: string[];
  cta_label: string | null;
  answered_steps: QuestionKey[];
  last_question_key: QuestionKey | null;
};

export const DEFAULT_PROJECT_ASSISTANT_OUTPUT: ProjectAssistantOutput = {
  message:
    "Soy tu asistente de proyecto con IA. Para orientarte bien, cuéntame qué quieres construir o mejorar ahora mismo.",
  project_type: null,
  detected_needs: [],
  goal: null,
  current_situation: null,
  urgency: null,
  target_platform: null,
  needs_backend: null,
  needs_admin_panel: null,
  integrations: [],
  qualification_level: null,
  interest_in_ai: null,
  interest_in_automation: null,
  ready_for_cta: false,
  lead_summary: null,
  conversation_phase: "discovering",
  collected_data: {
    projectType: null,
    mainGoal: null,
    featuresNeeded: [],
    currentSituation: null,
    targetPlatform: null,
    urgency: null,
    needsBackend: null,
    needsAdminPanel: null,
    integrations: [],
    aiInterest: null,
    automationInterest: null,
  },
  slot_status: {
    projectType: "not_asked",
    mainGoal: "not_asked",
    featuresNeeded: "not_asked",
    currentSituation: "not_asked",
    targetPlatform: "not_asked",
    urgency: "not_asked",
    needsBackend: "not_asked",
    needsAdminPanel: "not_asked",
    integrations: "not_asked",
    aiInterest: "not_asked",
    automationInterest: "not_asked",
  },
  missing_critical_fields: [
    "tipo de proyecto",
    "objetivo principal",
    "necesidades clave",
    "punto de partida",
  ],
  should_ask_follow_up: true,
  follow_up_questions: [],
  cta_label: null,
  answered_steps: [],
  last_question_key: null,
};

export function projectTypeToService(projectType: ProjectType | null) {
  if (!projectType) return "Estrategia digital";

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
