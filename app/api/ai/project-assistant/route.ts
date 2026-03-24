import { NextResponse } from "next/server";

import {
  generateProjectAssistantResponse,
} from "@/src/lib/project-assistant/openai";
import { projectAssistantRequestSchema } from "@/src/lib/validators/project-assistant-schema";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 18;
const ipRateMap = new Map<string, number[]>();

function canProceedByRateLimit(ip: string) {
  const now = Date.now();
  const entries = ipRateMap.get(ip) ?? [];
  const fresh = entries.filter((value) => now - value <= RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
    ipRateMap.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  ipRateMap.set(ip, fresh);
  return true;
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de solicitud no válido." },
      { status: 400 },
    );
  }

  const parsed = projectAssistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de solicitud no válidos." },
      { status: 400 },
    );
  }

  const ip = getRequestIp(request);
  if (!canProceedByRateLimit(ip)) {
    return NextResponse.json(
      { error: "Has enviado demasiadas solicitudes. Inténtalo de nuevo en unos segundos." },
      { status: 429 },
    );
  }

  const result = await generateProjectAssistantResponse(parsed.data.messages);
  if (!result.ok) {
    if (result.code === "config_error") {
      return NextResponse.json({ error: result.message }, { status: 503 });
    }

    if (result.code === "provider_error") {
      return NextResponse.json(
        {
          warning: "OpenAI no respondió correctamente. Se aplica un fallback contextual.",
          data: result.fallback,
          meta: { source: "fallback" },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        warning: "La respuesta de IA llegó incompleta. Se aplica un fallback contextual.",
        data: result.fallback,
        meta: { source: "fallback" },
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ data: result.data, meta: { source: result.source } });
}
