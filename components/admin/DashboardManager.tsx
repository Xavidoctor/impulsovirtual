"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BasicAdvancedToggle,
  DASHBOARD_MODE_EVENT,
  DASHBOARD_MODE_STORAGE_KEY,
  type DashboardMode,
} from "@/components/admin/BasicAdvancedToggle";
import { HelpTooltip } from "@/components/admin/HelpTooltip";
import { InfoModal } from "@/components/admin/InfoModal";
import type { DashboardPayload, DashboardPeriod } from "@/src/lib/dashboard/types";

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
];

const helpContent: Record<
  string,
  { what: string; why: string; worry: string; action: string }
> = {
  visitantes: {
    what: "Personas distintas que han entrado en la web durante el periodo.",
    why: "Te indica el alcance real del sitio.",
    worry: "Si cae varios días seguidos sin una razón clara.",
    action: "Revisa campañas, SEO y enlaces que te traen tráfico.",
  },
  conversion: {
    what: "Porcentaje de visitantes que terminan enviando un contacto.",
    why: "Mide cuánto convierte el tráfico en oportunidades reales.",
    worry: "Si baja fuerte mientras el tráfico se mantiene estable.",
    action: "Revisa CTA, claridad del formulario y velocidad de carga.",
  },
  consumo: {
    what: "Nivel de uso de Vercel, Supabase, R2 y email frente a sus límites.",
    why: "Te ayuda a evitar sobrecostes y caídas por límites.",
    worry: "Cuando aparece en naranja o rojo.",
    action: "Optimiza recursos, sube de plan o limita tareas automáticas.",
  },
  rendimiento: {
    what: "Estado general de la experiencia de carga y navegación.",
    why: "Impacta en SEO, conversión y percepción de calidad.",
    worry: "Si aparece como problema o no hay datos durante mucho tiempo.",
    action: "Conecta fuentes de medición y revisa páginas más pesadas.",
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value);
}

function formatDelta(value: number) {
  if (!Number.isFinite(value)) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function statusColor(status: string) {
  if (status === "rojo" || status === "problema") return "text-red-300 border-red-300/35 bg-red-500/10";
  if (status === "naranja") return "text-orange-200 border-orange-300/35 bg-orange-500/10";
  if (status === "amarillo" || status === "vigilar")
    return "text-amber-200 border-amber-300/35 bg-amber-500/10";
  if (status === "correcto" || status === "verde")
    return "text-emerald-200 border-emerald-300/35 bg-emerald-500/10";
  return "text-neutral-300 border-white/20 bg-white/5";
}

function dataModeLabel(mode: string) {
  if (mode === "real") return "Dato real";
  if (mode === "estimado") return "Estimación";
  if (mode === "manual") return "Manual";
  return "Sin datos";
}

function toMode(): DashboardMode {
  if (typeof window === "undefined") return "basico";
  const value = window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
  return value === "avanzado" ? "avanzado" : "basico";
}

export function DashboardManager({ initialData }: { initialData: DashboardPayload }) {
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<DashboardPeriod>(initialData.period);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<DashboardMode>("basico");
  const [helpKey, setHelpKey] = useState<string | null>(null);

  useEffect(() => {
    setMode(toMode());
    function onModeChange() {
      setMode(toMode());
    }
    window.addEventListener("storage", onModeChange);
    window.addEventListener(DASHBOARD_MODE_EVENT, onModeChange as EventListener);
    return () => {
      window.removeEventListener("storage", onModeChange);
      window.removeEventListener(DASHBOARD_MODE_EVENT, onModeChange as EventListener);
    };
  }, []);

  async function loadPeriod(nextPeriod: DashboardPeriod) {
    setPeriod(nextPeriod);
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/dashboard?period=${nextPeriod}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo cargar el dashboard.");
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      { key: "visitantes", label: "Visitantes", metric: data.summary.visitors },
      { key: "sesiones", label: "Sesiones", metric: data.summary.sessions },
      { key: "paginas", label: "Páginas vistas", metric: data.summary.pageViews },
      { key: "contactos", label: "Contactos", metric: data.summary.contacts },
      { key: "conversion", label: "Conversión", metric: data.summary.conversion, suffix: "%" },
      { key: "cta", label: "Clicks en CTA", metric: data.summary.ctaClicks },
    ],
    [data.summary],
  );

  return (
    <section className="space-y-8">
      <InfoModal
        open={Boolean(helpKey)}
        title="Ayuda contextual"
        content={helpKey ? helpContent[helpKey] : null}
        onClose={() => setHelpKey(null)}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-display text-4xl tracking-wide">Dashboard</h1>
          <p className="text-sm text-neutral-400">
            Métricas de negocio, rendimiento y consumo del proyecto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BasicAdvancedToggle value={mode} onChange={setMode} />
          <div className="inline-flex overflow-hidden rounded-md border border-white/15">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void loadPeriod(option.value)}
                className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] ${
                  period === option.value
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-300/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{card.label}</p>
              {card.key in helpContent ? (
                <HelpTooltip
                  title={card.label}
                  shortText={helpContent[card.key]?.what ?? ""}
                  onOpen={() => setHelpKey(card.key)}
                />
              ) : null}
            </div>
            <p className="mt-2 text-3xl text-white">
              {formatNumber(card.metric.value)}
              {card.suffix ?? ""}
            </p>
            <p
              className={`mt-2 text-xs ${
                card.metric.delta >= 0 ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {formatDelta(card.metric.deltaPercent)} vs periodo anterior
            </p>
            {mode === "avanzado" ? (
              <p className="mt-1 text-[11px] text-neutral-500">
                Actual: {formatNumber(card.metric.value)} · Anterior:{" "}
                {formatNumber(card.metric.previous)} · Delta:{" "}
                {formatNumber(card.metric.delta)}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl tracking-wide">Evolución</h2>
            <span className="text-xs text-neutral-500">
              {loading ? "Actualizando..." : `Actualizado: ${new Date(data.updatedAt).toLocaleString("es-ES")}`}
            </span>
          </div>
          {data.series.length ? (
            <div className="space-y-2">
              {data.series.map((item) => (
                <div key={item.label} className="grid grid-cols-[90px_1fr_auto] items-center gap-2">
                  <span className="text-xs text-neutral-500">{item.label}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-sky-300/80"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.pageViews /
                            Math.max(...data.series.map((entry) => entry.pageViews), 1)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-neutral-300">{item.pageViews} vistas</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">Aún no hay eventos en este periodo.</p>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-2xl tracking-wide">Rendimiento</h2>
            <HelpTooltip
              title="Rendimiento"
              shortText={helpContent.rendimiento.what}
              onOpen={() => setHelpKey("rendimiento")}
            />
          </div>
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusColor(data.performance.status)}`}>
            {data.performance.status.toUpperCase()}
          </span>
          <p className="mt-2 text-sm text-neutral-300">
            {data.performance.score !== null
              ? `Score disponible: ${data.performance.score.toFixed(1)}`
              : "Sin score externo aún"}
          </p>
          <p className="mt-2 text-xs text-neutral-500">{data.performance.note}</p>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="font-display text-2xl tracking-wide">Tráfico y negocio</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">Top páginas</p>
              <ul className="space-y-1 text-sm text-neutral-300">
                {data.topPages.length ? data.topPages.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.key}</span>
                    <span>{item.value}</span>
                  </li>
                )) : <li className="text-neutral-500">Sin datos</li>}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">Top proyectos</p>
              <ul className="space-y-1 text-sm text-neutral-300">
                {data.topProjects.length ? data.topProjects.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.key}</span>
                    <span>{item.value}</span>
                  </li>
                )) : <li className="text-neutral-500">Sin datos</li>}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">Fuentes</p>
              <ul className="space-y-1 text-sm text-neutral-300">
                {data.topSources.length ? data.topSources.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.key}</span>
                    <span>{item.value}</span>
                  </li>
                )) : <li className="text-neutral-500">Sin datos</li>}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">Dispositivos</p>
              <ul className="space-y-1 text-sm text-neutral-300">
                {data.devices.length ? data.devices.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.key}</span>
                    <span>{item.value}</span>
                  </li>
                )) : <li className="text-neutral-500">Sin datos</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-2xl tracking-wide">Consumo y límites</h2>
            <HelpTooltip
              title="Consumo"
              shortText={helpContent.consumo.what}
              onOpen={() => setHelpKey("consumo")}
            />
          </div>
          <div className="grid gap-3">
            {data.usage.map((item) => (
              <article key={item.platform} className="rounded-md border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium uppercase tracking-[0.12em] text-neutral-200">
                    {item.platform === "cloudflare_r2" ? "Cloudflare R2" : item.platform}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-neutral-300">
                      {dataModeLabel(item.dataMode)}
                    </span>
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${statusColor(item.status)}`}>
                      {item.status === "sin_datos" ? "SIN DATOS" : item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-neutral-300">
                  Usado: {formatNumber(item.used)} {item.unit}
                  {item.limit ? ` / Límite: ${formatNumber(item.limit)} ${item.unit}` : ""}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.percent !== null ? `Uso: ${item.percent.toFixed(1)}%` : "Sin límite configurado"} ·
                  Última sincronización: {item.lastSync ? new Date(item.lastSync).toLocaleString("es-ES") : "No disponible"}
                </p>
                {item.missingCredentials.length ? (
                  <p className="mt-1 text-[11px] text-amber-300">
                    Faltan credenciales: {item.missingCredentials.join(", ")}
                  </p>
                ) : null}
                {mode === "avanzado" ? (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Fuente: {item.source} · {item.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <h2 className="font-display text-2xl tracking-wide">Alertas activas</h2>
        <div className="mt-3 space-y-2">
          {data.alerts.length ? (
            data.alerts.map((alert) => (
              <article
                key={alert.id}
                className={`rounded-md border px-3 py-2 text-sm ${statusColor(alert.severity)}`}
              >
                <p>{alert.message}</p>
                {mode === "avanzado" ? (
                  <p className="mt-1 text-xs text-neutral-300">{alert.help_copy}</p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No hay alertas activas en este momento.</p>
          )}
        </div>
      </section>
    </section>
  );
}
