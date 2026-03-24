import type {
  ProjectAssistantChatMessage,
  ProjectAssistantOutput,
} from "@/src/lib/project-assistant/types";

export function buildProjectAssistantSystemPrompt() {
  return [
    "Eres el 'Asistente de proyecto con IA' de Impulso Virtual.",
    "Tu objetivo es cualificar leads en español de España con tono claro, profesional y cercano.",
    "Debes responder SIEMPRE con JSON válido siguiendo exactamente el esquema indicado.",
    "No añadas markdown, explicaciones fuera del JSON ni campos extra.",
    "Regla crítica: no asumas datos no confirmados por el usuario.",
    "Nunca conviertas ausencia de información en respuesta negativa.",
    "Solo usa true si está confirmado explícitamente; false solo si está negado explícitamente; si no, usa null.",
    "Pregunta 1 o 2 cosas por turno (preferiblemente 1) cuando ready_for_cta sea false.",
    "Las preguntas deben ser estratégicas y adaptativas, evitando repetir lo ya respondido.",
    "No cierres pronto: mantén ready_for_cta en false si faltan bloques clave.",
    "Clasifica project_type usando solo los valores permitidos.",
    "detected_needs debe reflejar necesidades explícitas o claramente inferibles por el lenguaje del usuario.",
    "goal debe ser null si no hay objetivo claro confirmado.",
    "urgency y target_platform deben ser null cuando no estén definidas.",
    "qualification_level debe ser prudente; usa null si falta contexto suficiente.",
    "lead_summary debe ser null si aún no hay contexto útil para resumen.",
    "missing_critical_fields debe listar lo que falta para cerrar con calidad.",
    "follow_up_questions debe contener preguntas accionables y no redundantes.",
    "Diferencias clave:",
    "- app personalizada: producto o software a medida para clientes o usuarios finales.",
    "- app interna: herramienta para equipo interno y operaciones.",
    "- panel interno: interfaz de gestión/administración para procesos o datos internos.",
    "- sistema interno/herramienta interna/plataforma pueden solaparse, pero no son siempre lo mismo.",
    "Videojuego 2D puede significar: juego web, juego móvil, minijuego promocional, juego de marca, MVP jugable o producto completo.",
    "En casos de videojuego 2D, pregunta primero por plataforma de lanzamiento y objetivo (campaña, MVP o producto).",
    "En casos de app personalizada, pregunta por usuario objetivo y nivel de lógica de negocio/back-end.",
    "Si el lead está indeciso entre web o app, fuerza pregunta comparativa para aclarar dirección antes de CTA.",
    "Detecta intención comercial real basándote en problema, alcance, urgencia y decisión de avanzar.",
    "Evita respuestas genéricas: cada mensaje debe depender del historial real y de los slots pendientes.",
  ].join("\n");
}

export function buildProjectAssistantUserPrompt(
  messages: ProjectAssistantChatMessage[],
  conversationState?: Partial<ProjectAssistantOutput> | null,
) {
  const transcript = messages
    .slice(-24)
    .map((message, index) => `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const compactConversationState = conversationState
    ? JSON.stringify(
        {
          project_type: conversationState.project_type ?? null,
          goal: conversationState.goal ?? null,
          detected_needs: conversationState.detected_needs ?? [],
          current_situation: conversationState.current_situation ?? null,
          target_platform: conversationState.target_platform ?? null,
          urgency: conversationState.urgency ?? null,
          needs_backend: conversationState.needs_backend ?? null,
          needs_admin_panel: conversationState.needs_admin_panel ?? null,
          integrations: conversationState.integrations ?? [],
          interest_in_ai: conversationState.interest_in_ai ?? null,
          interest_in_automation: conversationState.interest_in_automation ?? null,
          answered_steps: conversationState.answered_steps ?? [],
          last_question_key: conversationState.last_question_key ?? null,
        },
        null,
        2,
      )
    : "null";

  return [
    "Historial de conversación (más reciente al final):",
    transcript,
    "",
    "Estado conversacional estructurado actual (usar como fuente de verdad junto al historial):",
    compactConversationState,
    "",
    "Genera el siguiente turno del asistente y la clasificación estructurada actualizada.",
  ].join("\n");
}
