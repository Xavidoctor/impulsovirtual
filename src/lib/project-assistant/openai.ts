import "server-only";

import type {
  ProjectAssistantChatMessage,
  ProjectAssistantOutput,
  ProjectType,
  TargetPlatform,
  Urgency,
} from "@/src/lib/project-assistant/types";
import { DEFAULT_PROJECT_ASSISTANT_OUTPUT } from "@/src/lib/project-assistant/types";
import {
  buildProjectAssistantSystemPrompt,
  buildProjectAssistantUserPrompt,
} from "@/src/lib/project-assistant/prompt";
import {
  knownNeedsSet,
  projectAssistantOutputSchema,
} from "@/src/lib/validators/project-assistant-schema";

const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const DEFAULT_MODEL = process.env.OPENAI_PROJECT_ASSISTANT_MODEL?.trim() || "gpt-4o-mini";

type GenerateResult =
  | { ok: true; data: ProjectAssistantOutput; source: "openai" }
  | {
      ok: false;
      code: "config_error" | "provider_error";
      message: string;
      fallback: ProjectAssistantOutput;
    };

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
      refusal?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type OpenAIJsonSchemaResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

type OpenAIJsonObjectResponseFormat = {
  type: "json_object";
};

type OpenAIResponseFormat =
  | OpenAIJsonSchemaResponseFormat
  | OpenAIJsonObjectResponseFormat;

const responseJsonSchema = {
  name: "project_assistant_response_v2",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "message",
      "project_type",
      "detected_needs",
      "goal",
      "current_situation",
      "urgency",
      "target_platform",
      "needs_backend",
      "needs_admin_panel",
      "integrations",
      "qualification_level",
      "interest_in_ai",
      "interest_in_automation",
      "ready_for_cta",
      "lead_summary",
      "conversation_phase",
      "collected_data",
      "slot_status",
      "missing_critical_fields",
      "should_ask_follow_up",
      "follow_up_questions",
      "cta_label",
    ],
    properties: {
      message: { type: "string" },
      project_type: {
        anyOf: [
          { type: "null" },
          {
            type: "string",
            enum: [
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
            ],
          },
        ],
      },
      detected_needs: {
        type: "array",
        items: { type: "string" },
      },
      goal: { anyOf: [{ type: "string" }, { type: "null" }] },
      current_situation: {
        anyOf: [
          { type: "null" },
          { type: "string", enum: ["desde_cero", "ya_tengo_algo"] },
        ],
      },
      urgency: {
        anyOf: [
          { type: "null" },
          { type: "string", enum: ["alta", "media", "baja", "desconocida"] },
        ],
      },
      target_platform: {
        anyOf: [
          { type: "null" },
          { type: "string", enum: ["web", "móvil", "web y móvil", "escritorio", "campaña", "desconocida"] },
        ],
      },
      needs_backend: { anyOf: [{ type: "boolean" }, { type: "null" }] },
      needs_admin_panel: { anyOf: [{ type: "boolean" }, { type: "null" }] },
      integrations: { type: "array", items: { type: "string" } },
      qualification_level: {
        anyOf: [{ type: "null" }, { type: "string", enum: ["low", "medium", "high"] }],
      },
      interest_in_ai: { anyOf: [{ type: "boolean" }, { type: "null" }] },
      interest_in_automation: { anyOf: [{ type: "boolean" }, { type: "null" }] },
      ready_for_cta: { type: "boolean" },
      lead_summary: { anyOf: [{ type: "string" }, { type: "null" }] },
      conversation_phase: {
        type: "string",
        enum: ["discovering", "qualifying", "ready_for_cta"],
      },
      collected_data: { type: "object" },
      slot_status: { type: "object" },
      missing_critical_fields: { type: "array", items: { type: "string" } },
      should_ask_follow_up: { type: "boolean" },
      follow_up_questions: { type: "array", items: { type: "string" } },
      cta_label: { anyOf: [{ type: "string" }, { type: "null" }] },
    },
  },
};

const APP_KEYWORDS = [
  "app",
  "aplicación",
  "aplicacion",
  "software",
  "plataforma",
  "sistema",
  "herramienta",
  "saas",
  "mvp",
] as const;

const APP_INTERNAL_KEYWORDS = [
  "interna",
  "interno",
  "equipo",
  "empleados",
  "operativa",
  "operaciones",
  "backoffice",
  "gestión interna",
  "gestion interna",
] as const;

const EXTERNAL_APP_KEYWORDS = [
  "cliente",
  "clientes",
  "usuario final",
  "usuarios finales",
  "público",
  "publico",
  "consumidor",
  "consumidores",
] as const;

const PANEL_KEYWORDS = [
  "panel",
  "dashboard",
  "admin",
  "administración",
  "administracion",
  "backoffice",
] as const;

const GAME_KEYWORDS = [
  "videojuego",
  "juego 2d",
  "minijuego",
  "game",
  "jugable",
  "mecánica",
  "mecanica",
] as const;

const WEB_KEYWORDS = [
  "web",
  "sitio",
  "página",
  "pagina",
  "landing",
  "corporativa",
  "rediseño",
  "rediseño web",
  "rediseno",
] as const;

const AMBIGUOUS_WEB_APP_KEYWORDS = [
  "no se si",
  "no sé si",
  "dudo entre",
  "web o app",
  "app o web",
  "web o aplicación",
  "web o aplicacion",
] as const;

const AI_KEYWORDS = ["ia", "ai", "inteligencia artificial", "agente", "asistente"] as const;
const AUTOMATION_KEYWORDS = [
  "automatización",
  "automatizacion",
  "automatizar",
  "flujo",
  "n8n",
  "zapier",
] as const;

const INTERNAL_MESSAGE_PATTERNS = [
  /modo continuidad/i,
  /fallback/i,
  /debug/i,
  /openai no respondi/i,
  /se estabiliza/i,
  /respuesta incompleta/i,
  /error de esquema/i,
] as const;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string) {
  return cleanText(value).toLowerCase();
}

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (normalizedKeyword.length <= 2) {
      const pattern = new RegExp(`(^|\\s)${normalizedKeyword}(\\s|$)`, "i");
      return pattern.test(text);
    }
    return text.includes(normalizedKeyword);
  });
}

function aggregateUserText(messages: ProjectAssistantChatMessage[]) {
  return normalizeText(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" "),
  );
}

function countUserTurns(messages: ProjectAssistantChatMessage[]) {
  return messages.filter((message) => message.role === "user").length;
}

function getLastAssistantMessage(messages: ProjectAssistantChatMessage[]) {
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  return lastAssistant ? cleanText(lastAssistant.content) : "";
}

function inferProjectTypeFromTranscript(text: string, fallback: ProjectType | null): ProjectType | null {
  const hasGame = includesAny(text, GAME_KEYWORDS);
  if (hasGame) return "videojuego 2D";

  const hasApp = includesAny(text, APP_KEYWORDS);
  const hasPanel = includesAny(text, PANEL_KEYWORDS);
  const hasInternal = includesAny(text, APP_INTERNAL_KEYWORDS);
  const hasExternalAudience = includesAny(text, EXTERNAL_APP_KEYWORDS);

  if (hasApp) {
    if (hasPanel && hasInternal && !hasExternalAudience) return "panel interno";
    if (hasInternal && !hasExternalAudience) return "app interna";
    return "app personalizada";
  }

  if (hasPanel && hasInternal) return "panel interno";

  if (text.includes("tienda") || text.includes("ecommerce") || text.includes("e-commerce")) {
    return "tienda online";
  }
  if (text.includes("landing")) return "landing page";
  if (text.includes("rediseño") || text.includes("rediseno")) return "rediseño web";
  if (text.includes("automatización") || text.includes("automatizacion")) return "automatización";
  if (includesAny(text, AI_KEYWORDS)) return "integración de IA";
  if (includesAny(text, WEB_KEYWORDS)) return "web corporativa";

  return fallback;
}

function inferTargetPlatform(text: string, fallback: TargetPlatform | null): TargetPlatform | null {
  const hasWeb = text.includes("web");
  const hasMobile =
    text.includes("movil") || text.includes("móvil") || text.includes("android") || text.includes("ios");
  const hasDesktop = text.includes("escritorio") || text.includes("desktop");
  const hasCampaign = text.includes("campaña") || text.includes("campana");

  if (hasWeb && hasMobile) return "web y móvil";
  if (hasCampaign) return "campaña";
  if (hasMobile) return "móvil";
  if (hasDesktop) return "escritorio";
  if (hasWeb) return "web";
  return fallback;
}

function inferUrgency(text: string, fallback: Urgency | null): Urgency | null {
  if (
    text.includes("urgente") ||
    text.includes("cuanto antes") ||
    text.includes("esta semana") ||
    text.includes("este mes")
  ) {
    return "alta";
  }
  if (
    text.includes("próximo trimestre") ||
    text.includes("proximo trimestre") ||
    text.includes("en unos meses")
  ) {
    return "baja";
  }
  if (text.includes("este trimestre") || text.includes("próximas semanas") || text.includes("proximas semanas")) {
    return "media";
  }
  return fallback;
}

function inferCurrentSituation(text: string): "desde_cero" | "ya_tengo_algo" | null {
  if (
    text.includes("desde cero") ||
    text.includes("empezar de cero") ||
    text.includes("no tengo web") ||
    text.includes("no tenemos nada")
  ) {
    return "desde_cero";
  }

  if (
    text.includes("ya tengo") ||
    text.includes("ya tenemos") ||
    text.includes("web actual") ||
    text.includes("tienda actual") ||
    text.includes("rediseñar") ||
    text.includes("rehacer")
  ) {
    return "ya_tengo_algo";
  }

  return null;
}

function inferIntegrationsFromText(text: string) {
  const integrations: string[] = [];

  if (text.includes("whatsapp")) addNeed(integrations, "WhatsApp");
  if (text.includes("stripe")) addNeed(integrations, "Stripe");
  if (text.includes("paypal")) addNeed(integrations, "PayPal");
  if (text.includes("shopify")) addNeed(integrations, "Shopify");
  if (text.includes("woocommerce")) addNeed(integrations, "WooCommerce");
  if (text.includes("crm")) addNeed(integrations, "CRM");
  if (text.includes("erp")) addNeed(integrations, "ERP");
  if (text.includes("zapier")) addNeed(integrations, "Zapier");
  if (text.includes("n8n")) addNeed(integrations, "n8n");

  return normalizeNeeds(integrations);
}

function inferExplicitTriState(
  text: string,
  keywords: readonly string[],
  explicitNegativePatterns: RegExp[],
) {
  if (!includesAny(text, keywords)) return null;
  if (
    text.includes("no sé si") ||
    text.includes("no se si") ||
    text.includes("quizá") ||
    text.includes("quizas")
  ) {
    return null;
  }
  if (explicitNegativePatterns.some((pattern) => pattern.test(text))) {
    return false;
  }
  return true;
}

function normalizeNeeds(needs: string[]) {
  const unique = new Map<string, string>();

  for (const item of needs) {
    const normalized = cleanText(item);
    if (!normalized) continue;

    const knownMatch = Array.from(knownNeedsSet).find(
      (known) => known.toLowerCase() === normalized.toLowerCase(),
    );
    const value = knownMatch ?? normalized;
    const key = value.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, value);
    }
  }

  return Array.from(unique.values()).slice(0, 12);
}

function addNeed(needs: string[], need: string) {
  if (!needs.some((item) => item.toLowerCase() === need.toLowerCase())) {
    needs.push(need);
  }
}

function inferNeedsFromText(text: string, baseNeeds: string[]) {
  const needs = [...baseNeeds];

  if (text.includes("lead")) addNeed(needs, "captación de leads");
  if (text.includes("whatsapp")) addNeed(needs, "WhatsApp");
  if (text.includes("reserva")) addNeed(needs, "reservas");
  if (text.includes("pago") || text.includes("stripe")) addNeed(needs, "pagos");
  if (text.includes("ecommerce") || text.includes("tienda")) addNeed(needs, "ecommerce");
  if (includesAny(text, AI_KEYWORDS)) addNeed(needs, "integración de IA");
  if (includesAny(text, AUTOMATION_KEYWORDS)) addNeed(needs, "automatización");
  if (text.includes("soporte")) addNeed(needs, "soporte al cliente");
  if (text.includes("login") || text.includes("cuenta")) addNeed(needs, "login y cuentas");
  if (text.includes("backend") || text.includes("api")) addNeed(needs, "backend");
  if (text.includes("panel")) addNeed(needs, "panel de administración");
  if (includesAny(text, GAME_KEYWORDS)) addNeed(needs, "juego 2D para web, móvil o campaña");

  return normalizeNeeds(needs);
}

function inferGoalFromMessages(messages: ProjectAssistantChatMessage[], fallback: string | null) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return fallback;
  const text = cleanText(lastUser.content);
  if (text.length < 12) return fallback;
  const normalized = normalizeText(text);
  if (
    !normalized.includes("quiero") &&
    !normalized.includes("necesito") &&
    !normalized.includes("busco") &&
    !normalized.includes("mejorar") &&
    !normalized.includes("vender") &&
    !normalized.includes("captar")
  ) {
    return fallback;
  }
  return text.slice(0, 220);
}

function hasAmbiguousWebVsApp(text: string) {
  if (includesAny(text, AMBIGUOUS_WEB_APP_KEYWORDS)) return true;
  return text.includes("web") && text.includes("app") && (text.includes("no se") || text.includes("no sé"));
}

function buildStrategicQuestion(
  projectType: ProjectType | null,
  text: string,
  currentPlatform: TargetPlatform | null,
) {
  if (!projectType) {
    return "Para orientarte bien, ¿qué tipo de proyecto necesitas ahora: web, tienda online, app, automatización, IA, videojuego 2D u otro?";
  }

  if (hasAmbiguousWebVsApp(text)) {
    return "Para orientarte bien, ¿qué pesa más ahora: captar clientes con una web o resolver procesos con una aplicación?";
  }

  if (projectType === "videojuego 2D") {
    if (!currentPlatform) {
      return "Para plantearlo bien, ¿dónde quieres lanzar primero el juego 2D: web, móvil o campaña puntual?";
    }
    return "¿Buscas un minijuego promocional rápido o un producto 2D con evolución por fases?";
  }

  if (projectType === "app personalizada") {
    return "¿Esta app a medida está orientada a clientes finales o al uso interno de tu equipo?";
  }

  if (projectType === "app interna" || projectType === "panel interno") {
    return "¿Qué proceso interno concreto quieres simplificar primero con más impacto en tiempo o costes?";
  }

  if (projectType === "web corporativa" || projectType === "landing page" || projectType === "rediseño web") {
    return "¿Cuál es la conversión principal que quieres mejorar primero: contactos, reservas o ventas?";
  }

  if (projectType === "tienda online") {
    return "¿Qué necesitas priorizar en la tienda online: catálogo, pagos, logística o captación de tráfico?";
  }

  if (projectType === "automatización") {
    return "¿Qué flujo quieres automatizar primero para ahorrar más tiempo desde el primer mes?";
  }

  if (projectType === "integración de IA") {
    return "¿En qué parte del negocio quieres aplicar IA primero para notar impacto real en operaciones o ventas?";
  }

  return "¿Cuál es el resultado principal que te haría decir que el proyecto ha sido un éxito?";
}

function buildSituationQuestion() {
  return "¿Partimos desde cero o ya tienes una web/sistema actual que quieras mejorar?";
}

function buildUrgencyQuestion() {
  return "¿Qué plazo manejas para lanzar la primera versión: este mes, este trimestre o sin fecha cerrada?";
}

function buildTechnicalQuestion() {
  return "¿Necesitas backend, panel de administración o integraciones externas en esta primera fase?";
}

function buildAutomationAiQuestion() {
  return "¿Te interesa incorporar automatización o IA en esta fase, o prefieres dejarlo para después?";
}

function isInternalMessage(value: string) {
  return INTERNAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeUserFacingMessage(message: string, fallbackQuestion: string, readyForCta: boolean) {
  const cleaned = cleanText(message);
  if (!cleaned || isInternalMessage(cleaned)) {
    return readyForCta
      ? "Perfecto, ya tengo contexto suficiente para preparar una propuesta inicial útil. Si te encaja, pulsa “Quiero esto en mi web” y seguimos por contacto."
      : fallbackQuestion;
  }
  return cleaned;
}

function avoidConsecutiveDuplicateQuestion(
  message: string,
  messages: ProjectAssistantChatMessage[],
  projectType: ProjectType | null,
  text: string,
  currentPlatform: TargetPlatform | null,
) {
  const normalized = cleanText(message).toLowerCase();
  const lastAssistant = getLastAssistantMessage(messages).toLowerCase();
  if (!lastAssistant || normalized !== lastAssistant) {
    return message;
  }

  const alternatives = [
    buildSituationQuestion(),
    buildUrgencyQuestion(),
    buildTechnicalQuestion(),
    buildAutomationAiQuestion(),
    buildStrategicQuestion(projectType, text, currentPlatform),
  ];

  for (const candidate of alternatives) {
    if (cleanText(candidate).toLowerCase() !== lastAssistant) {
      return candidate;
    }
  }

  return message;
}

function ensureSingleQuestion(message: string, fallbackQuestion: string, readyForCta: boolean) {
  const normalized = cleanText(message);
  if (readyForCta) {
    return normalized || "Perfecto, ya tengo un diagnóstico inicial. Si te encaja, seguimos por contacto.";
  }

  const questionMatches = normalized.match(/[^?]+\?/g);
  if (!questionMatches || questionMatches.length === 0) {
    return fallbackQuestion;
  }

  return cleanText(questionMatches[0] ?? fallbackQuestion);
}

function buildLeadSummary(output: ProjectAssistantOutput) {
  if (!output.project_type || !output.goal) return null;

  const lines: string[] = [];
  lines.push(`Proyecto clasificado como ${output.project_type} con objetivo: ${output.goal}.`);

  if (output.detected_needs.length > 0) {
    lines.push(`Necesidades detectadas: ${output.detected_needs.join(", ")}.`);
  }
  if (output.current_situation) {
    lines.push(
      output.current_situation === "desde_cero"
        ? "Parte desde cero."
        : "Parte de una base ya existente.",
    );
  }
  if (output.target_platform) {
    lines.push(`Plataforma objetivo: ${output.target_platform}.`);
  }
  if (output.urgency) {
    lines.push(`Urgencia: ${output.urgency}.`);
  }
  if (output.integrations.length > 0) {
    lines.push(`Integraciones mencionadas: ${output.integrations.join(", ")}.`);
  }
  if (output.needs_backend === true) lines.push("Se confirma necesidad de backend.");
  if (output.needs_backend === false) lines.push("Se descarta backend en esta fase.");
  if (output.needs_admin_panel === true) lines.push("Se confirma necesidad de panel de administración.");
  if (output.needs_admin_panel === false) lines.push("Se descarta panel de administración en esta fase.");
  if (output.interest_in_ai === true) lines.push("Existe interés explícito en IA.");
  if (output.interest_in_ai === false) lines.push("Se descarta IA en esta fase.");
  if (output.interest_in_automation === true) lines.push("Existe interés explícito en automatización.");
  if (output.interest_in_automation === false) lines.push("Se descarta automatización en esta fase.");

  return cleanText(lines.join(" ")).slice(0, 680);
}

function buildMissingCriticalFields(output: ProjectAssistantOutput) {
  const missing: string[] = [];

  if (!output.project_type) missing.push("tipo de proyecto");
  if (!output.goal) missing.push("objetivo principal");
  if (output.detected_needs.length < 2) missing.push("al menos 2 necesidades o requisitos clave");
  if (!output.current_situation) missing.push("punto de partida (desde cero o base existente)");

  let optionalBlocks = 0;
  if (output.target_platform) optionalBlocks += 1;
  if (output.urgency) optionalBlocks += 1;
  if (output.needs_backend !== null || output.needs_admin_panel !== null) optionalBlocks += 1;
  if (output.integrations.length > 0) optionalBlocks += 1;
  if (output.interest_in_automation !== null) optionalBlocks += 1;
  if (output.interest_in_ai !== null) optionalBlocks += 1;

  if (optionalBlocks < 2) {
    missing.push("faltan señales de cualificación adicional (mínimo 2 bloques extra)");
  }

  return normalizeNeeds(missing).slice(0, 16);
}

function buildSlotStatus(
  messages: ProjectAssistantChatMessage[],
  output: ProjectAssistantOutput,
) {
  const assistantText = normalizeText(
    messages
      .filter((message) => message.role === "assistant")
      .map((message) => message.content)
      .join(" "),
  );

  const wasAsked = (keywords: string[]) => keywords.some((keyword) => assistantText.includes(keyword));
  const boolStatus = (value: boolean | null, askedKeywords: string[]) => {
    if (value === true) return "filled" as const;
    if (value === false) return "explicitly_negative" as const;
    return wasAsked(askedKeywords) ? ("missing" as const) : ("not_asked" as const);
  };

  return {
    projectType: output.project_type ? "filled" : wasAsked(["tipo", "proyecto", "web", "app"]) ? "missing" : "not_asked",
    mainGoal: output.goal ? "filled" : wasAsked(["objetivo", "resultado"]) ? "missing" : "not_asked",
    featuresNeeded:
      output.detected_needs.length > 0
        ? "filled"
        : wasAsked(["necesidad", "funcionalidad", "priorizar"]) ? "missing" : "not_asked",
    currentSituation:
      output.current_situation
        ? "filled"
        : wasAsked(["desde cero", "actual", "ya tienes"]) ? "missing" : "not_asked",
    targetPlatform:
      output.target_platform
        ? "filled"
        : wasAsked(["plataforma", "web", "móvil", "movil"]) ? "missing" : "not_asked",
    urgency:
      output.urgency
        ? "filled"
        : wasAsked(["urgencia", "plazo", "fecha"]) ? "missing" : "not_asked",
    needsBackend: boolStatus(output.needs_backend, ["backend", "api"]),
    needsAdminPanel: boolStatus(output.needs_admin_panel, ["panel", "admin", "dashboard"]),
    integrations:
      output.integrations.length > 0
        ? "filled"
        : wasAsked(["integración", "integracion", "herramienta externa"]) ? "missing" : "not_asked",
    aiInterest: boolStatus(output.interest_in_ai, [" ia ", "inteligencia artificial"]),
    automationInterest: boolStatus(output.interest_in_automation, ["automat"]),
  } as const;
}

function isReadyForCta(output: ProjectAssistantOutput, text: string, turns: number) {
  if (turns < 3) return false;
  if (hasAmbiguousWebVsApp(text)) return false;
  return buildMissingCriticalFields(output).length === 0;
}

function buildNextQuestion(output: ProjectAssistantOutput, text: string) {
  if (!output.project_type || hasAmbiguousWebVsApp(text)) {
    return buildStrategicQuestion(output.project_type, text, output.target_platform);
  }
  if (!output.goal) {
    return "¿Cuál es el objetivo principal que quieres conseguir con este proyecto?";
  }
  if (output.detected_needs.length < 2) {
    return buildStrategicQuestion(output.project_type, text, output.target_platform);
  }
  if (!output.current_situation) {
    return buildSituationQuestion();
  }
  if (!output.target_platform) {
    return buildStrategicQuestion(output.project_type, text, output.target_platform);
  }
  if (!output.urgency) {
    return buildUrgencyQuestion();
  }
  if (output.needs_backend === null && output.needs_admin_panel === null && output.integrations.length === 0) {
    return buildTechnicalQuestion();
  }
  if (output.interest_in_ai === null || output.interest_in_automation === null) {
    return buildAutomationAiQuestion();
  }
  return buildStrategicQuestion(output.project_type, text, output.target_platform);
}

function sanitizeOutput(output: ProjectAssistantOutput, messages: ProjectAssistantChatMessage[]): ProjectAssistantOutput {
  const transcriptText = aggregateUserText(messages);
  const turns = countUserTurns(messages);
  const inferredType = inferProjectTypeFromTranscript(transcriptText, output.project_type);
  const inferredPlatform = inferTargetPlatform(transcriptText, output.target_platform);
  const inferredUrgency = inferUrgency(transcriptText, output.urgency);
  const inferredCurrentSituation = inferCurrentSituation(transcriptText);
  const inferredIntegrations = inferIntegrationsFromText(transcriptText);
  const explicitBackend = inferExplicitTriState(
    transcriptText,
    ["backend", "api", "base de datos", "servidor"],
    [/no necesito.*backend/, /sin backend/, /no queremos.*backend/],
  );
  const explicitAdminPanel = inferExplicitTriState(
    transcriptText,
    ["panel", "dashboard", "admin", "administración", "administracion"],
    [/no necesito.*panel/, /sin panel/, /no queremos.*panel/],
  );
  const explicitAi = inferExplicitTriState(
    transcriptText,
    ["ia", "ai", "inteligencia artificial"],
    [/no quiero.*ia/, /sin ia/, /no necesito.*ia/],
  );
  const explicitAutomation = inferExplicitTriState(
    transcriptText,
    ["automatización", "automatizacion", "automatizar", "n8n", "zapier"],
    [/no quiero.*automat/, /sin automat/, /no necesito.*automat/],
  );

  const nextOutput: ProjectAssistantOutput = {
    ...output,
    project_type: inferredType,
    target_platform: inferredPlatform === "desconocida" ? null : inferredPlatform,
    urgency: inferredUrgency === "desconocida" ? null : inferredUrgency,
    message: cleanText(output.message),
    goal: inferGoalFromMessages(messages, output.goal),
    current_situation: output.current_situation ?? inferredCurrentSituation,
    lead_summary: output.lead_summary ? cleanText(output.lead_summary) : null,
    detected_needs: inferNeedsFromText(transcriptText, output.detected_needs),
    needs_backend: output.needs_backend ?? explicitBackend,
    needs_admin_panel: output.needs_admin_panel ?? explicitAdminPanel,
    integrations: normalizeNeeds([...output.integrations, ...inferredIntegrations]).slice(0, 12),
    interest_in_ai: output.interest_in_ai ?? explicitAi,
    interest_in_automation: output.interest_in_automation ?? explicitAutomation,
  };

  if (nextOutput.project_type === "videojuego 2D") {
    addNeed(nextOutput.detected_needs, "juego 2D para web, móvil o campaña");
  }

  const fallbackQuestion = buildNextQuestion(nextOutput, transcriptText);
  nextOutput.ready_for_cta = isReadyForCta(nextOutput, transcriptText, turns);
  nextOutput.message = sanitizeUserFacingMessage(
    nextOutput.message,
    fallbackQuestion,
    nextOutput.ready_for_cta,
  );
  nextOutput.message = ensureSingleQuestion(nextOutput.message, fallbackQuestion, nextOutput.ready_for_cta);
  if (!nextOutput.ready_for_cta) {
    nextOutput.message = avoidConsecutiveDuplicateQuestion(
      nextOutput.message,
      messages,
      nextOutput.project_type,
      transcriptText,
      nextOutput.target_platform,
    );
  }

  if (nextOutput.ready_for_cta) {
    nextOutput.message =
      "Perfecto, ya tengo contexto suficiente para preparar una propuesta inicial útil. Si te encaja, pulsa “Quiero esto en mi web” y seguimos por contacto.";
    nextOutput.qualification_level =
      nextOutput.detected_needs.length >= 3 ? "high" : "medium";
  } else {
    nextOutput.qualification_level = null;
  }

  if (nextOutput.ready_for_cta && (!nextOutput.lead_summary || nextOutput.lead_summary.length < 25)) {
    nextOutput.lead_summary = buildLeadSummary(nextOutput);
  } else if (!nextOutput.ready_for_cta) {
    nextOutput.lead_summary = null;
  }

  nextOutput.conversation_phase = nextOutput.ready_for_cta
    ? "ready_for_cta"
    : turns <= 1
      ? "discovering"
      : "qualifying";
  nextOutput.missing_critical_fields = buildMissingCriticalFields(nextOutput);
  nextOutput.should_ask_follow_up = !nextOutput.ready_for_cta;
  nextOutput.follow_up_questions = nextOutput.ready_for_cta ? [] : [nextOutput.message];
  nextOutput.cta_label = nextOutput.ready_for_cta ? "Quiero esto en mi web" : null;
  nextOutput.slot_status = buildSlotStatus(messages, nextOutput);
  nextOutput.collected_data = {
    projectType: nextOutput.project_type,
    mainGoal: nextOutput.goal,
    featuresNeeded: nextOutput.detected_needs,
    currentSituation: nextOutput.current_situation,
    targetPlatform: nextOutput.target_platform,
    urgency: nextOutput.urgency,
    needsBackend: nextOutput.needs_backend,
    needsAdminPanel: nextOutput.needs_admin_panel,
    integrations: nextOutput.integrations,
    aiInterest: nextOutput.interest_in_ai,
    automationInterest: nextOutput.interest_in_automation,
  };

  return nextOutput;
}

function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
}

function readContent(response: OpenAIChatCompletionResponse): string | null {
  const message = response.choices?.[0]?.message;
  if (!message || message.refusal) return null;

  const content = message.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  const chunks = content
    .map((chunk) => (typeof chunk?.text === "string" ? chunk.text : ""))
    .filter(Boolean);

  return chunks.length > 0 ? chunks.join("\n") : null;
}

function buildProviderErrorMessage(payload: OpenAIChatCompletionResponse, status: number) {
  const base = payload.error?.message?.trim();
  if (base) return base;
  return `El proveedor de IA devolvió un error (${status}).`;
}

export function buildDeterministicFallbackOutput(messages: ProjectAssistantChatMessage[]) {
  const userText = aggregateUserText(messages);
  const turns = countUserTurns(messages);

  const detectedType = inferProjectTypeFromTranscript(userText, null);
  const targetPlatform = inferTargetPlatform(userText, null);
  const urgency = inferUrgency(userText, null);
  const needs = inferNeedsFromText(userText, []);
  const currentSituation = inferCurrentSituation(userText);
  const integrations = inferIntegrationsFromText(userText);
  const explicitBackend = inferExplicitTriState(
    userText,
    ["backend", "api", "base de datos", "servidor"],
    [/no necesito.*backend/, /sin backend/, /no queremos.*backend/],
  );
  const explicitAdminPanel = inferExplicitTriState(
    userText,
    ["panel", "dashboard", "admin", "administración", "administracion"],
    [/no necesito.*panel/, /sin panel/, /no queremos.*panel/],
  );
  const explicitAi = inferExplicitTriState(
    userText,
    ["ia", "ai", "inteligencia artificial"],
    [/no quiero.*ia/, /sin ia/, /no necesito.*ia/],
  );
  const explicitAutomation = inferExplicitTriState(
    userText,
    ["automatización", "automatizacion", "automatizar", "n8n", "zapier"],
    [/no quiero.*automat/, /sin automat/, /no necesito.*automat/],
  );

  const fallback: ProjectAssistantOutput = {
    ...DEFAULT_PROJECT_ASSISTANT_OUTPUT,
    project_type: detectedType,
    detected_needs: needs,
    goal: inferGoalFromMessages(messages, null),
    current_situation: currentSituation,
    urgency,
    target_platform: targetPlatform,
    needs_backend: explicitBackend,
    needs_admin_panel: explicitAdminPanel,
    integrations,
    qualification_level: null,
    interest_in_ai: explicitAi,
    interest_in_automation: explicitAutomation,
    ready_for_cta: false,
    lead_summary: null,
    message: "",
  };

  fallback.ready_for_cta = isReadyForCta(fallback, userText, turns);
  fallback.message = fallback.ready_for_cta
    ? "Perfecto, ya tengo contexto suficiente para preparar una propuesta inicial útil. Si te encaja, pulsa “Quiero esto en mi web” y seguimos por contacto."
    : buildNextQuestion(fallback, userText);
  if (!fallback.ready_for_cta) {
    fallback.message = avoidConsecutiveDuplicateQuestion(
      fallback.message,
      messages,
      fallback.project_type,
      userText,
      fallback.target_platform,
    );
  }
  fallback.qualification_level = fallback.ready_for_cta ? (needs.length >= 3 ? "high" : "medium") : null;
  fallback.lead_summary = fallback.ready_for_cta ? buildLeadSummary(fallback) : null;
  fallback.conversation_phase = fallback.ready_for_cta
    ? "ready_for_cta"
    : turns <= 1
      ? "discovering"
      : "qualifying";
  fallback.missing_critical_fields = buildMissingCriticalFields(fallback);
  fallback.should_ask_follow_up = !fallback.ready_for_cta;
  fallback.follow_up_questions = fallback.ready_for_cta ? [] : [fallback.message];
  fallback.cta_label = fallback.ready_for_cta ? "Quiero esto en mi web" : null;
  fallback.slot_status = buildSlotStatus(messages, fallback);
  fallback.collected_data = {
    projectType: fallback.project_type,
    mainGoal: fallback.goal,
    featuresNeeded: fallback.detected_needs,
    currentSituation: fallback.current_situation,
    targetPlatform: fallback.target_platform,
    urgency: fallback.urgency,
    needsBackend: fallback.needs_backend,
    needsAdminPanel: fallback.needs_admin_panel,
    integrations: fallback.integrations,
    aiInterest: fallback.interest_in_ai,
    automationInterest: fallback.interest_in_automation,
  };
  return fallback;
}

export async function generateProjectAssistantResponse(
  messages: ProjectAssistantChatMessage[],
): Promise<GenerateResult> {
  const deterministicFallback = buildDeterministicFallbackOutput(messages);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      code: "config_error",
      message: "OPENAI_API_KEY no está configurada en el servidor.",
      fallback: deterministicFallback,
    };
  }

  const systemPrompt = buildProjectAssistantSystemPrompt();
  const userPrompt = buildProjectAssistantUserPrompt(messages);

  const candidateModels = Array.from(
    new Set([DEFAULT_MODEL, "gpt-4o-mini", "gpt-4.1-mini"]),
  ).filter(Boolean);

  const responseFormats: OpenAIResponseFormat[] = [
    {
      type: "json_schema",
      json_schema: responseJsonSchema,
    },
    {
      type: "json_object",
    },
  ];

  let lastProviderError = "No se pudo generar la respuesta del asistente con OpenAI.";
  for (const model of candidateModels) {
    for (const responseFormat of responseFormats) {
      let providerResponse: Response;
      try {
        providerResponse = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.35,
            response_format: responseFormat,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(25000),
        });
      } catch (error) {
        lastProviderError =
          error instanceof Error
            ? `No se pudo conectar con OpenAI: ${error.message}`
            : "No se pudo conectar con OpenAI.";
        continue;
      }

      let payload: OpenAIChatCompletionResponse;
      try {
        payload = (await providerResponse.json()) as OpenAIChatCompletionResponse;
      } catch {
        lastProviderError = "Respuesta no válida del proveedor de IA.";
        continue;
      }

      if (!providerResponse.ok) {
        lastProviderError = buildProviderErrorMessage(payload, providerResponse.status);
        continue;
      }

      const rawContent = readContent(payload);
      if (!rawContent) {
        return { ok: true, data: deterministicFallback, source: "openai" };
      }

      const maybeJson = parseJson(rawContent);
      if (!maybeJson) {
        return { ok: true, data: deterministicFallback, source: "openai" };
      }

      const parsed = projectAssistantOutputSchema.safeParse(maybeJson);
      if (!parsed.success) {
        return { ok: true, data: deterministicFallback, source: "openai" };
      }

      const safeOutput = sanitizeOutput(parsed.data, messages);
      return { ok: true, data: safeOutput, source: "openai" };
    }
  }

  return {
    ok: false,
    code: "provider_error",
    message: lastProviderError,
    fallback: deterministicFallback,
  };
}

export function fallbackAssistantOutput(messages: ProjectAssistantChatMessage[] = []) {
  if (messages.length === 0) {
    return DEFAULT_PROJECT_ASSISTANT_OUTPUT;
  }
  return buildDeterministicFallbackOutput(messages);
}
