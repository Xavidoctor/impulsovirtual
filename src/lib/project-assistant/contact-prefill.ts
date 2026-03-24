import {
  projectTypeToService,
  type ProjectAssistantOutput,
} from "@/src/lib/project-assistant/types";

function asHumanBoolean(value: boolean) {
  return value ? "Sí" : "No";
}

function asQualificationLabel(value: ProjectAssistantOutput["qualification_level"]) {
  if (value === "high") return "alto";
  if (value === "medium") return "medio";
  return "bajo";
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function buildAssistantContactMessage(output: ProjectAssistantOutput) {
  const needs =
    output.detected_needs.length > 0
      ? output.detected_needs.map((item) => cleanLine(item)).join(", ")
      : "Pendiente de concretar";

  const lines = [
    "Hola equipo de Impulso Virtual,",
    "",
    "Vengo del Asistente de proyecto con IA y quiero avanzar con esta necesidad.",
    `- Tipo de proyecto: ${output.project_type}`,
    `- Objetivo principal: ${cleanLine(output.goal)}`,
    `- Necesidades detectadas: ${needs}`,
    `- Plataforma objetivo: ${output.target_platform}`,
    `- Urgencia: ${output.urgency}`,
    `- ¿Requiere backend?: ${asHumanBoolean(output.needs_backend)}`,
    `- Interés en IA: ${asHumanBoolean(output.interest_in_ai)}`,
    `- Interés en automatización: ${asHumanBoolean(output.interest_in_automation)}`,
    `- Nivel de cualificación detectado: ${asQualificationLabel(output.qualification_level)}`,
    "",
    `Resumen: ${cleanLine(output.lead_summary)}`,
    "",
    "Me gustaría recibir una propuesta inicial con alcance recomendado y siguientes pasos.",
  ];

  return lines.join("\n").trim();
}

export function buildAssistantContactHref(output: ProjectAssistantOutput) {
  const params = new URLSearchParams();
  params.set("message", buildAssistantContactMessage(output));
  params.set("service", projectTypeToService(output.project_type));
  params.set("source", "ai_project_assistant");
  return `/contacto?${params.toString()}`;
}
