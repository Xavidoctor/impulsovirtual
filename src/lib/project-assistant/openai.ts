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
      code: "config_error" | "provider_error" | "invalid_response";
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
  name: "project_assistant_response",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "message",
      "project_type",
      "detected_needs",
      "goal",
      "urgency",
      "target_platform",
      "needs_backend",
      "qualification_level",
      "interest_in_ai",
      "interest_in_automation",
      "ready_for_cta",
      "lead_summary",
    ],
    properties: {
      message: { type: "string" },
      project_type: {
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
      detected_needs: {
        type: "array",
        items: { type: "string" },
      },
      goal: { type: "string" },
      urgency: {
        type: "string",
        enum: ["alta", "media", "baja", "desconocida"],
      },
      target_platform: {
        type: "string",
        enum: ["web", "móvil", "web y móvil", "escritorio", "campaña", "desconocida"],
      },
      needs_backend: { type: "boolean" },
      qualification_level: {
        type: "string",
        enum: ["low", "medium", "high"],
      },
      interest_in_ai: { type: "boolean" },
      interest_in_automation: { type: "boolean" },
      ready_for_cta: { type: "boolean" },
      lead_summary: { type: "string" },
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

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string) {
  return cleanText(value).toLowerCase();
}

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword));
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

function inferProjectTypeFromTranscript(text: string, fallback: ProjectType): ProjectType {
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

function inferTargetPlatform(text: string, fallback: TargetPlatform): TargetPlatform {
  const hasWeb = text.includes("web");
  const hasMobile =
    text.includes("movil") || text.includes("móvil") || text.includes("android") || text.includes("ios");
  const hasDesktop = text.includes("escritorio") || text.includes("desktop");
  const hasCampaign = text.includes("campaña") || text.includes("campana");

  if (hasWeb && hasMobile) return "web y móvil";
  if (hasCampaign && (hasWeb || hasMobile || hasDesktop)) return "desconocida";
  if (hasCampaign) return "campaña";
  if (hasMobile) return "móvil";
  if (hasDesktop) return "escritorio";
  if (hasWeb) return "web";
  return fallback;
}

function inferUrgency(text: string, fallback: Urgency): Urgency {
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

function inferGoalFromMessages(messages: ProjectAssistantChatMessage[], fallback: string) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return fallback;
  const text = cleanText(lastUser.content);
  if (text.length < 8) return fallback;
  return text.slice(0, 220);
}

function hasAmbiguousWebVsApp(text: string) {
  if (includesAny(text, AMBIGUOUS_WEB_APP_KEYWORDS)) return true;
  return text.includes("web") && text.includes("app") && (text.includes("no se") || text.includes("no sé"));
}

function buildStrategicQuestion(projectType: ProjectType, text: string, currentPlatform: TargetPlatform) {
  if (hasAmbiguousWebVsApp(text)) {
    return "Para orientarte bien, ¿qué pesa más ahora: captar clientes con una web o resolver procesos con una aplicación?";
  }

  if (projectType === "videojuego 2D") {
    if (currentPlatform === "desconocida") {
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
  const needs = output.detected_needs.length > 0 ? output.detected_needs.join(", ") : "sin necesidades concretas aún";
  return cleanText(
    `Proyecto clasificado como ${output.project_type}. Objetivo: ${output.goal}. Necesidades: ${needs}. Urgencia ${output.urgency} y plataforma ${output.target_platform}.`,
  ).slice(0, 680);
}

function shouldHoldCta(output: ProjectAssistantOutput, text: string, userTurns: number) {
  if (!output.ready_for_cta) return true;
  if (userTurns < 2) return true;
  if (hasAmbiguousWebVsApp(text)) return true;
  if (output.detected_needs.length === 0) return true;
  if (output.goal.toLowerCase().includes("pendiente")) return true;
  if (output.lead_summary.trim().length < 25) return true;
  if (
    (output.project_type === "app personalizada" ||
      output.project_type === "app interna" ||
      output.project_type === "panel interno" ||
      output.project_type === "videojuego 2D") &&
    output.target_platform === "desconocida"
  ) {
    return true;
  }
  return false;
}

function canFallbackEnableCta(output: ProjectAssistantOutput, text: string, userTurns: number) {
  if (userTurns < 3) return false;
  if (hasAmbiguousWebVsApp(text)) return false;
  if (output.detected_needs.length < 2) return false;
  if (output.goal.trim().length < 18) return false;
  if (
    (output.project_type === "app personalizada" ||
      output.project_type === "app interna" ||
      output.project_type === "panel interno" ||
      output.project_type === "videojuego 2D") &&
    output.target_platform === "desconocida"
  ) {
    return false;
  }
  return output.project_type !== "otro";
}

function sanitizeOutput(output: ProjectAssistantOutput, messages: ProjectAssistantChatMessage[]): ProjectAssistantOutput {
  const transcriptText = aggregateUserText(messages);
  const userTurns = countUserTurns(messages);
  const inferredType = inferProjectTypeFromTranscript(transcriptText, output.project_type);
  const inferredPlatform = inferTargetPlatform(transcriptText, output.target_platform);
  const inferredUrgency = inferUrgency(transcriptText, output.urgency);

  const nextOutput: ProjectAssistantOutput = {
    ...output,
    project_type: inferredType,
    target_platform: inferredPlatform,
    urgency: inferredUrgency,
    message: cleanText(output.message),
    goal: cleanText(inferGoalFromMessages(messages, output.goal)),
    lead_summary: cleanText(output.lead_summary),
    detected_needs: inferNeedsFromText(transcriptText, output.detected_needs),
    needs_backend:
      output.needs_backend ||
      inferredType === "app personalizada" ||
      inferredType === "app interna" ||
      inferredType === "panel interno" ||
      transcriptText.includes("backend") ||
      transcriptText.includes("api"),
    interest_in_ai: output.interest_in_ai || includesAny(transcriptText, AI_KEYWORDS),
    interest_in_automation:
      output.interest_in_automation || includesAny(transcriptText, AUTOMATION_KEYWORDS),
  };

  if (nextOutput.project_type === "videojuego 2D") {
    addNeed(nextOutput.detected_needs, "juego 2D para web, móvil o campaña");
  }

  const fallbackQuestion = buildStrategicQuestion(
    nextOutput.project_type,
    transcriptText,
    nextOutput.target_platform,
  );

  const holdCta = shouldHoldCta(nextOutput, transcriptText, userTurns);
  nextOutput.ready_for_cta = !holdCta;
  nextOutput.message = ensureSingleQuestion(nextOutput.message, fallbackQuestion, nextOutput.ready_for_cta);

  if (nextOutput.ready_for_cta) {
    nextOutput.message =
      "Perfecto, ya tengo un diagnóstico inicial claro. Si te encaja, pasa al contacto y preparo una propuesta con siguientes pasos.";
    nextOutput.qualification_level =
      nextOutput.qualification_level === "low" ? "medium" : nextOutput.qualification_level;
  }

  if (!nextOutput.lead_summary || nextOutput.lead_summary.length < 25) {
    nextOutput.lead_summary = buildLeadSummary(nextOutput);
  }

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
  const userTurns = countUserTurns(messages);

  const detectedType = inferProjectTypeFromTranscript(userText, "otro");
  const targetPlatform = inferTargetPlatform(userText, "desconocida");
  const urgency = inferUrgency(userText, "desconocida");
  const needs = inferNeedsFromText(userText, []);
  const ambiguity = hasAmbiguousWebVsApp(userText);

  const fallback: ProjectAssistantOutput = {
    ...DEFAULT_PROJECT_ASSISTANT_OUTPUT,
    project_type: detectedType,
    detected_needs: needs,
    goal: inferGoalFromMessages(messages, "Definir alcance y enfoque inicial del proyecto"),
    urgency,
    target_platform: targetPlatform,
    needs_backend:
      detectedType === "app personalizada" ||
      detectedType === "app interna" ||
      detectedType === "panel interno" ||
      userText.includes("backend") ||
      userText.includes("api"),
    qualification_level: userTurns >= 3 ? "medium" : "low",
    interest_in_ai: includesAny(userText, AI_KEYWORDS),
    interest_in_automation: includesAny(userText, AUTOMATION_KEYWORDS),
    ready_for_cta: false,
    lead_summary: "",
    message: "",
  };

  if (ambiguity) {
    fallback.project_type = "otro";
  }

  const readyForCta = canFallbackEnableCta(fallback, userText, userTurns);
  fallback.ready_for_cta = readyForCta;
  fallback.qualification_level = readyForCta ? "medium" : fallback.qualification_level;

  fallback.message = readyForCta
    ? "Perfecto, ya tengo un diagnóstico inicial claro. Si te encaja, pasa al contacto y preparo una propuesta con siguientes pasos."
    : buildStrategicQuestion(
        fallback.project_type,
        userText,
        fallback.target_platform,
      );
  fallback.lead_summary = buildLeadSummary(fallback);
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
  let hadInvalidStructuredResponse = false;

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
        hadInvalidStructuredResponse = true;
        lastProviderError = "El proveedor de IA no devolvió contenido utilizable.";
        continue;
      }

      const maybeJson = parseJson(rawContent);
      if (!maybeJson) {
        hadInvalidStructuredResponse = true;
        lastProviderError = "No se pudo parsear la salida estructurada del asistente.";
        continue;
      }

      const parsed = projectAssistantOutputSchema.safeParse(maybeJson);
      if (!parsed.success) {
        hadInvalidStructuredResponse = true;
        lastProviderError =
          parsed.error.issues[0]?.message ||
          "La salida de IA no cumple el esquema requerido.";
        continue;
      }

      const safeOutput = sanitizeOutput(parsed.data, messages);
      return { ok: true, data: safeOutput, source: "openai" };
    }
  }

  if (hadInvalidStructuredResponse) {
    return {
      ok: false,
      code: "invalid_response",
      message: lastProviderError,
      fallback: deterministicFallback,
    };
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
