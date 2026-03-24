"use client";

import { useState } from "react";
import { PrivacyConsentCheckbox } from "@/components/legal/PrivacyConsentCheckbox";

type QuoteRequestFormProps = {
  serviceOptions: string[];
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budgetRange: string;
  deadline: string;
  projectSummary: string;
  references: string;
  privacyAccepted: boolean;
  website: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  projectType: "",
  budgetRange: "",
  deadline: "",
  projectSummary: "",
  references: "",
  privacyAccepted: false,
  website: "",
};

export function QuoteRequestForm({ serviceOptions }: QuoteRequestFormProps) {
  const [values, setValues] = useState<FormState>(initialState);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const isSubmitting = status === "loading";

  const update = (field: Exclude<keyof FormState, "privacyAccepted">, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service],
    );
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    if (!values.fullName.trim() || !values.email.trim()) {
      setStatus("error");
      setMessage("Completa nombre y email para continuar.");
      return;
    }

    if (values.projectSummary.trim().length < 30) {
      setStatus("error");
      setMessage("Describe el proyecto con al menos 30 caracteres.");
      return;
    }

    if (!values.privacyAccepted) {
      setStatus("error");
      setMessage("Debes aceptar la política de privacidad para continuar.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          company: values.company,
          projectType: values.projectType,
          requestedServices: selectedServices,
          budgetRange: values.budgetRange,
          deadline: values.deadline,
          projectSummary: values.projectSummary,
          references: values.references,
          privacyAccepted: values.privacyAccepted,
          website: values.website,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "No se pudo enviar la solicitud.");
        return;
      }

      setStatus("success");
      setMessage(
        payload.warning ||
          "Solicitud enviada correctamente. Revisaremos tu briefing y te contactaremos pronto.",
      );
      setValues(initialState);
      setSelectedServices([]);
    } catch {
      setStatus("error");
      setMessage("Error de red. Inténtalo de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate aria-busy={isSubmitting}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Nombre completo</span>
          <input
            required
            autoComplete="name"
            disabled={isSubmitting}
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Tipo de proyecto</span>
          <input
            disabled={isSubmitting}
            value={values.projectType}
            onChange={(event) => update("projectType", event.target.value)}
            placeholder="Web corporativa, relanzamiento, etc."
            className="focus-ring surface-input"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Rango de presupuesto</span>
          <input
            disabled={isSubmitting}
            value={values.budgetRange}
            onChange={(event) => update("budgetRange", event.target.value)}
            placeholder="5k-10k, 10k-20k..."
            className="focus-ring surface-input"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Fecha objetivo</span>
        <input
          disabled={isSubmitting}
          value={values.deadline}
          onChange={(event) => update("deadline", event.target.value)}
          placeholder="Fecha estimada o ventana de lanzamiento"
          className="focus-ring surface-input"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-[11px] uppercase tracking-[0.2em] text-muted">Servicios solicitados</legend>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((service) => {
            const checked = selectedServices.includes(service);
            return (
              <label
                key={service}
                className={`focus-ring inline-flex cursor-pointer items-center rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  checked
                    ? "border-accent/60 bg-accent/12 text-foreground"
                    : "border-white/12 bg-white/[0.02] text-muted hover:text-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => toggleService(service)}
                  className="sr-only"
                />
                {service}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="space-y-2 block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Resumen del proyecto</span>
        <textarea
          required
          minLength={30}
          rows={6}
          disabled={isSubmitting}
          value={values.projectSummary}
          onChange={(event) => update("projectSummary", event.target.value)}
          className="focus-ring surface-input min-h-[10rem] resize-y"
          placeholder="Objetivo principal, contexto actual y resultado esperado."
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Referencias</span>
        <textarea
          rows={4}
          disabled={isSubmitting}
          value={values.references}
          onChange={(event) => update("references", event.target.value)}
          placeholder="URLs, benchmarks o notas relevantes"
          className="focus-ring surface-input min-h-[8rem] resize-y"
        />
      </label>

      <PrivacyConsentCheckbox
        checked={values.privacyAccepted}
        onChange={(checked) => {
          setValues((prev) => ({ ...prev, privacyAccepted: checked }));
          if (status !== "idle") {
            setStatus("idle");
            setMessage("");
          }
        }}
        disabled={isSubmitting}
      />

      <label className="hidden" aria-hidden="true">
        <span>Website</span>
        <input
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="focus-ring btn-primary disabled:opacity-55">
          {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
        </button>
        <p className="text-xs text-muted">La información se usa solo para preparar la propuesta.</p>
      </div>

      {message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-accent/30 bg-accent/10 text-foreground"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
