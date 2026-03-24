"use client";

import { useCallback, useEffect, useState } from "react";
import { PrivacyConsentCheckbox } from "@/components/legal/PrivacyConsentCheckbox";
import { CONTACT_FORM_MIN_MESSAGE } from "@/lib/constants";
import { hasAnalyticsConsent } from "@/lib/cookies/consent";
import type { ContactFormValues } from "@/lib/contact-schema";

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  message: "",
  pageUrl: "",
  source: "",
  referrer: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  privacyAccepted: false,
  website: "",
};

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isSubmitting = status === "loading";

  const trackAnalytics = useCallback((eventType: "contact_form_view" | "contact_form_submit") => {
    if (!hasAnalyticsConsent()) return;
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        path: window.location.pathname,
        value: { source: "contact_form" },
      }),
    });
  }, []);

  useEffect(() => {
    trackAnalytics("contact_form_view");
  }, [trackAnalytics]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const prefillMessage = (params.get("message") ?? "").trim();
    const prefillService = (params.get("service") ?? "").trim();
    const prefillSource = (params.get("source") ?? "").trim();

    if (!prefillMessage && !prefillService && !prefillSource) return;

    setValues((prev) => {
      let changed = false;
      const nextValues = { ...prev };

      if (prefillMessage.length > 0 && !prev.message.trim()) {
        nextValues.message = prefillMessage.slice(0, 2000);
        changed = true;
      }

      if (prefillService.length > 0 && !prev.service.trim()) {
        nextValues.service = prefillService.slice(0, 120);
        changed = true;
      }

      if (prefillSource.length > 0 && !(prev.source ?? "").trim()) {
        nextValues.source = prefillSource.slice(0, 80);
        changed = true;
      }

      return changed ? nextValues : prev;
    });
  }, []);

  const update = (field: Exclude<keyof ContactFormValues, "privacyAccepted">, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (status !== "idle") {
      setStatus("idle");
      setError("");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setError("");
    setSuccessMessage("");

    if (!values.name.trim() || !values.email.trim() || !values.service.trim()) {
      setStatus("error");
      setError("Completa nombre, email y servicio.");
      return;
    }

    if (values.message.trim().length < CONTACT_FORM_MIN_MESSAGE) {
      setStatus("error");
      setError(`El mensaje debe tener al menos ${CONTACT_FORM_MIN_MESSAGE} caracteres.`);
      return;
    }

    if (!values.privacyAccepted) {
      setStatus("error");
      setError("Debes aceptar la política de privacidad para continuar.");
      return;
    }

    setStatus("loading");

    try {
      const params = new URLSearchParams(window.location.search);
      const payloadBody = {
        ...values,
        pageUrl: window.location.href,
        source: values.source || "web_contact_form",
        referrer: document.referrer || "",
        utmSource: params.get("utm_source") ?? "",
        utmMedium: params.get("utm_medium") ?? "",
        utmCampaign: params.get("utm_campaign") ?? "",
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus("error");
        setError(payload.error ?? "No se pudo enviar el mensaje.");
        return;
      }

      setStatus("success");
      setSuccessMessage(
        payload.warning ||
          "Mensaje enviado correctamente. Te responderemos lo antes posible.",
      );
      setValues(initialValues);
      trackAnalytics("contact_form_submit");
    } catch {
      setStatus("error");
      setError("Error de red. Inténtalo de nuevo.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-busy={isSubmitting}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Nombre</span>
          <input
            required
            autoComplete="name"
            disabled={isSubmitting}
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            className="focus-ring surface-input"
            placeholder="Tu nombre"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Correo electrónico</span>
          <input
            type="email"
            required
            autoComplete="email"
            disabled={isSubmitting}
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            className="focus-ring surface-input"
            placeholder="nombre@empresa.com"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Empresa</span>
          <input
            disabled={isSubmitting}
            autoComplete="organization"
            value={values.company}
            onChange={(event) => update("company", event.target.value)}
            className="focus-ring surface-input"
            placeholder="Nombre de empresa"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Teléfono</span>
          <input
            disabled={isSubmitting}
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            className="focus-ring surface-input"
            placeholder="Opcional"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Servicio</span>
        <input
          required
          disabled={isSubmitting}
          value={values.service}
          onChange={(event) => update("service", event.target.value)}
          className="focus-ring surface-input"
          placeholder="Diseño web premium, estrategia digital..."
        />
      </label>

      <label className="hidden" aria-hidden="true">
        <span>Website</span>
        <input
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Mensaje</span>
        <textarea
          rows={6}
          required
          minLength={CONTACT_FORM_MIN_MESSAGE}
          disabled={isSubmitting}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          className="focus-ring surface-input min-h-[9rem] resize-y"
          placeholder="Describe objetivo, contexto y necesidades prioritarias."
        />
      </label>

      <PrivacyConsentCheckbox
        checked={values.privacyAccepted}
        onChange={(checked) => {
          setValues((prev) => ({ ...prev, privacyAccepted: checked }));
          if (status !== "idle") {
            setStatus("idle");
            setError("");
            setSuccessMessage("");
          }
        }}
        disabled={isSubmitting}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="focus-ring btn-primary disabled:opacity-55">
          {isSubmitting ? "Enviando mensaje..." : "Enviar mensaje"}
        </button>
        <p className="text-xs text-muted">Respuesta habitual en menos de 24h laborables.</p>
      </div>

      {status === "success" ? (
        <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground" role="status" aria-live="polite">
          {successMessage}
        </p>
      ) : null}

      {status === "error" && error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </form>
  );
}
