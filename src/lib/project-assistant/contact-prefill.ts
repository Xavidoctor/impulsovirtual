import {
  projectTypeToService,
  type ProjectAssistantOutput,
} from "@/src/lib/project-assistant/types";

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function buildAssistantContactMessage(output: ProjectAssistantOutput) {
  const lines = [
    "Hola equipo de Impulso Virtual,",
    "",
    "Vengo del Asistente de proyecto con IA y quiero avanzar con esta necesidad.",
  ];

  if (output.project_type) {
    lines.push(`- Tipo de proyecto: ${output.project_type}`);
  }

  if (output.goal) {
    lines.push(`- Objetivo principal: ${cleanLine(output.goal)}`);
  }

  if (output.detected_needs.length > 0) {
    lines.push(`- Necesidades detectadas: ${output.detected_needs.map((item) => cleanLine(item)).join(", ")}`);
  }

  if (output.current_situation) {
    lines.push(
      `- Punto de partida: ${output.current_situation === "desde_cero" ? "desde cero" : "base actual a mejorar"}`,
    );
  }

  if (output.target_platform) {
    lines.push(`- Plataforma objetivo: ${output.target_platform}`);
  }

  if (output.urgency) {
    lines.push(`- Urgencia: ${output.urgency}`);
  }

  if (output.needs_backend !== null) {
    lines.push(`- Backend: ${output.needs_backend ? "sí" : "no"}`);
  }

  if (output.needs_admin_panel !== null) {
    lines.push(`- Panel de administración: ${output.needs_admin_panel ? "sí" : "no"}`);
  }

  if (output.integrations.length > 0) {
    lines.push(`- Integraciones: ${output.integrations.join(", ")}`);
  }

  if (output.interest_in_ai !== null) {
    lines.push(`- Interés en IA: ${output.interest_in_ai ? "sí" : "no"}`);
  }

  if (output.interest_in_automation !== null) {
    lines.push(`- Interés en automatización: ${output.interest_in_automation ? "sí" : "no"}`);
  }

  lines.push(
    "",
  );

  if (output.lead_summary) {
    lines.push(`Resumen: ${cleanLine(output.lead_summary)}`);
    lines.push("");
  }

  lines.push(
    "",
    "Me gustaría recibir una propuesta inicial con alcance recomendado y siguientes pasos.",
  );

  return lines.join("\n").trim();
}

export function buildAssistantContactHref(output: ProjectAssistantOutput) {
  const params = new URLSearchParams();
  params.set("message", buildAssistantContactMessage(output));
  params.set("service", projectTypeToService(output.project_type));
  params.set("source", "ai_project_assistant");
  return `/contacto?${params.toString()}`;
}
