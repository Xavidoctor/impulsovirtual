"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { getCookieConsent, subscribeCookieConsent } from "@/lib/cookies/consent";
import { buildAssistantContactHref } from "@/src/lib/project-assistant/contact-prefill";
import {
  DEFAULT_PROJECT_ASSISTANT_OUTPUT,
  type ProjectAssistantChatMessage,
  type ProjectAssistantOutput,
} from "@/src/lib/project-assistant/types";
import { projectAssistantApiResponseSchema } from "@/src/lib/validators/project-assistant-schema";

type LocalMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const INITIAL_ASSISTANT_MESSAGE =
  "Soy tu asistente de proyecto con IA. Cuéntame qué quieres construir o mejorar y te guío paso a paso.";

function createLocalMessage(role: LocalMessage["role"], content: string): LocalMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
  };
}

function toChatMessages(messages: LocalMessage[]): ProjectAssistantChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function buildAlternativeAssistantMessage(state: ProjectAssistantOutput) {
  if (state.ready_for_cta) {
    return "Perfecto, con este diagnóstico ya podemos preparar una propuesta inicial. Si te encaja, avanzamos por contacto.";
  }

  if (state.project_type === "videojuego 2D") {
    return "Para afinar el alcance, ¿quieres lanzar primero en web, móvil o como campaña puntual?";
  }

  if (state.project_type === "app personalizada") {
    return "Para enfocar la primera fase, ¿qué funcionalidad mínima debería tener la app desde el inicio?";
  }

  if (state.project_type === "app interna" || state.project_type === "panel interno") {
    return "¿Qué proceso interno quieres resolver primero para notar impacto real en tiempo o costes?";
  }

  if (state.project_type === "tienda online") {
    return "Para priorizar bien, ¿qué bloque necesitas resolver antes: catálogo, pagos, logística o captación?";
  }

  if (state.project_type === "web corporativa" || state.project_type === "landing page") {
    return "¿Cuál es la acción principal que quieres mejorar primero: contactos, reservas o ventas?";
  }

  return "Para avanzar con foco, ¿cuál sería el resultado más importante para ti en esta primera fase?";
}

export function ProjectAssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const messagesRef = useRef<LocalMessage[]>([]);

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasConsentDecision, setHasConsentDecision] = useState(true);
  const [assistantState, setAssistantState] = useState<ProjectAssistantOutput>({
    ...DEFAULT_PROJECT_ASSISTANT_OUTPUT,
    message: INITIAL_ASSISTANT_MESSAGE,
  });
  const [messages, setMessages] = useState<LocalMessage[]>([
    createLocalMessage("assistant", INITIAL_ASSISTANT_MESSAGE),
  ]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const hideWidget = useMemo(() => {
    if (!pathname) return false;
    if (pathname.startsWith("/admin")) return true;
    if (pathname === "/contacto" || pathname === "/solicitar-propuesta") return true;
    return false;
  }, [pathname]);

  const userTurns = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  const isLoading = status === "loading";
  const canSend = input.trim().length > 0 && !isLoading;
  const canShowCta =
    assistantState.ready_for_cta &&
    assistantState.conversation_phase === "ready_for_cta";

  useEffect(() => {
    setHasConsentDecision(getCookieConsent() !== null);
    return subscribeCookieConsent((consent) => {
      setHasConsentDecision(consent !== null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, open, isLoading]);

  if (hideWidget) return null;

  const bottomOffset = hasConsentDecision
    ? "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] md:bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]"
    : "bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] md:bottom-[calc(env(safe-area-inset-bottom)+7.25rem)]";

  async function handleSubmit() {
    const userText = input.trim();
    if (!userText || isLoading || inFlightRef.current) return;
    inFlightRef.current = true;

    const userMessage = createLocalMessage("user", userText);
    const nextMessages = [...messagesRef.current, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/project-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: toChatMessages(nextMessages).slice(-20),
        }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        setStatus("error");
        setErrorMessage("El servidor devolvió una respuesta no válida.");
        return;
      }

      if (!response.ok) {
        const data = payload as { error?: string };
        const message =
          typeof data?.error === "string"
            ? data.error
            : "No se pudo continuar el diagnóstico en este momento.";
        setStatus("error");
        setErrorMessage(message);
        inFlightRef.current = false;
        return;
      }

      const parsed = projectAssistantApiResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setStatus("error");
        setErrorMessage("La respuesta del asistente no tiene el formato esperado.");
        inFlightRef.current = false;
        return;
      }

      const nextState = parsed.data.data;
      const lastAssistant = [...nextMessages].reverse().find((item) => item.role === "assistant");
      const assistantMessage =
        lastAssistant &&
        lastAssistant.content.trim().toLowerCase() ===
          nextState.message.trim().toLowerCase()
          ? buildAlternativeAssistantMessage(nextState)
          : nextState.message;

      setAssistantState(nextState);
      setMessages((prev) => [...prev, createLocalMessage("assistant", assistantMessage)]);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Error de red. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      inFlightRef.current = false;
    }
  }

  function handleReset() {
    setAssistantState({
      ...DEFAULT_PROJECT_ASSISTANT_OUTPUT,
      message: INITIAL_ASSISTANT_MESSAGE,
    });
    setMessages([createLocalMessage("assistant", INITIAL_ASSISTANT_MESSAGE)]);
    setInput("");
    setErrorMessage("");
    setStatus("idle");
    inFlightRef.current = false;
  }

  function handleCta() {
    const href = buildAssistantContactHref(assistantState);
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Cerrar asistente"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[64] cursor-default bg-black/55 backdrop-blur-[2px]"
        />
      ) : null}

      {!open ? (
        <div className={cn("fixed right-4 z-[65] md:right-6", bottomOffset)}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="assistant-panel"
            className="focus-ring inline-flex h-14 items-center gap-2 rounded-full border border-accent/35 bg-[#0b1618]/96 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground shadow-[0_16px_36px_-18px_rgba(0,0,0,0.8)] transition-all hover:border-accent/60 hover:brightness-110"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="hidden md:inline">Asistente IA</span>
            <span className="md:hidden">IA</span>
          </button>
        </div>
      ) : null}

      <div
        id="assistant-panel"
        className={cn(
          "fixed inset-x-3 z-[66] transition-all duration-300 md:inset-x-auto md:right-6 md:w-[430px]",
          bottomOffset,
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-5 opacity-0",
        )}
      >
        <section className="premium-panel overflow-hidden border-white/12 bg-[#071015]/99">
          <div className="pointer-events-none absolute inset-0 bg-[#04090d]/58" />
          <div className="noise-overlay" />
          <div className="relative z-[1] flex h-[min(74dvh,760px)] flex-col md:h-[min(78vh,760px)]">
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-accent">
                  Asistente de proyecto con IA
                </p>
                <p className="text-xs leading-relaxed text-muted">
                  Cualificamos tu idea en minutos para llegar al contacto con un briefing útil.
                </p>
              </div>
              <button
                type="button"
                className="focus-ring rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </header>

            <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.14em]">
              <span className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-foreground/90">
                {assistantState.project_type ?? "tipo pendiente"}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-foreground/90">
                Urgencia: {assistantState.urgency ?? "pendiente"}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-foreground/90">
                Plataforma: {assistantState.target_platform ?? "pendiente"}
              </span>
            </div>

            <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    "max-w-[92%] rounded-2xl border px-3.5 py-3 text-sm leading-relaxed",
                    message.role === "assistant"
                      ? "border-white/12 bg-[#111a1e] text-foreground"
                      : "ml-auto border-accent/30 bg-accent/10 text-foreground",
                  )}
                >
                  {message.content}
                </article>
              ))}

              {isLoading ? (
                <article className="max-w-[86%] rounded-2xl border border-white/12 bg-[#111a1e] px-3.5 py-3 text-sm text-muted">
                  Analizando tu proyecto con contexto comercial y técnico...
                </article>
              ) : null}
            </div>

            {errorMessage ? (
              <p
                className="mx-4 mb-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-200"
                role="status"
              >
                {errorMessage}
              </p>
            ) : null}

            {canShowCta ? (
              <div className="mx-4 mb-3 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-3">
                <p className="text-xs leading-relaxed text-foreground/95">
                  Diagnóstico completado. Hemos preparado un resumen coherente para que el equipo responda con enfoque.
                </p>
                <button
                  type="button"
                  onClick={handleCta}
                  className="focus-ring btn-primary mt-3 w-full justify-center"
                >
                  Quiero esto en mi web
                </button>
              </div>
            ) : null}

            <div className="border-t border-white/10 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <label className="sr-only" htmlFor="assistant-input">
                Mensaje para el asistente
              </label>
              <textarea
                id="assistant-input"
                rows={3}
                value={input}
                disabled={isLoading}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder="Escribe tu respuesta. Ejemplo: “No sé si necesito web o app, quiero captar leads”"
                className="focus-ring surface-input min-h-[84px] w-full resize-none text-sm"
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted">En escritorio puedes enviar con `Ctrl + Enter`.</p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!canSend}
                  className="focus-ring btn-primary flex-1 justify-center disabled:opacity-55"
                >
                  {isLoading ? "Pensando..." : "Enviar"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="focus-ring btn-secondary px-3.5 disabled:opacity-55"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
