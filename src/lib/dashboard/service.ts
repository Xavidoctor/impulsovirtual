import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  defaultAdminPanelSettings,
  getAdminPanelSettings,
  type AdminPanelSettings,
} from "@/src/lib/cms/admin-panel-settings";
import {
  fetchSupabaseUsage,
  refreshAnalyticsRollups,
} from "@/src/lib/dashboard/providers/supabase";
import { fetchVercelUsage } from "@/src/lib/dashboard/providers/vercel";
import { getR2UsageSummary } from "@/src/lib/r2/usage";
import type { DashboardPayload, DashboardPeriod } from "@/src/lib/dashboard/types";
import type { Database, Tables, TablesInsert } from "@/src/types/database.types";
import type { LeadEntity } from "@/src/types/entities";

type AnalyticsEventRow = Tables<"analytics_events">;
type LeadRow = Pick<LeadEntity, "id" | "created_at">;
type UsageSnapshotRow = Tables<"platform_usage_snapshots">;
type DailyRollupRow = Tables<"analytics_daily_rollups">;
type MonthlyRollupRow = Tables<"analytics_monthly_rollups">;

function domainDb(supabase: SupabaseClient<Database>) {
  return supabase as unknown as { from: (table: string) => any };
}

type MetricCard = {
  value: number;
  previous: number;
  delta: number;
  deltaPercent: number;
};

type PlatformCard = {
  platform: "vercel" | "supabase" | "cloudflare_r2" | "email";
  used: number;
  limit: number | null;
  unit: string;
  percent: number | null;
  status: "verde" | "amarillo" | "naranja" | "rojo" | "sin_datos";
  dataMode: "real" | "estimado" | "manual" | "sin_datos";
  source: string;
  lastSync: string | null;
  projection: number | null;
  notes: string;
  missingCredentials: string[];
};

const periodDays: Record<DashboardPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "6m": 183,
  "12m": 365,
};

const dayMs = 24 * 60 * 60 * 1000;

function formatBucket(date: Date, period: DashboardPeriod) {
  if (period === "12m") {
    return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
  }
  if (period === "6m") {
    const start = new Date(date);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return start.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  }
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function bucketKey(date: Date, period: DashboardPeriod) {
  if (period === "12m") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (period === "6m") {
    const start = new Date(date);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return start.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function computeDelta(value: number, previous: number): MetricCard {
  const delta = value - previous;
  const deltaPercent = previous > 0 ? (delta / previous) * 100 : value > 0 ? 100 : 0;
  return { value, previous, delta, deltaPercent };
}

function toTopList(input: Map<string, number>, limit = 6) {
  return [...input.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function severityFromPercent(percent: number | null): PlatformCard["status"] {
  if (percent === null || !Number.isFinite(percent)) return "sin_datos";
  if (percent >= 95) return "rojo";
  if (percent >= 85) return "naranja";
  if (percent >= 70) return "amarillo";
  return "verde";
}

function sourceMode(source: string): PlatformCard["dataMode"] {
  if (!source) return "sin_datos";
  if (source.includes("api") || source.includes("sql")) return "real";
  if (source.includes("interno_real")) return "real";
  if (source.includes("manual")) return "manual";
  if (source.includes("estim") || source.includes("fallback") || source.includes("interno"))
    return "estimado";
  return "estimado";
}

function buildRange(period: DashboardPeriod) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const days = periodDays[period];
  const start = new Date(end.getTime() - (days - 1) * dayMs);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * dayMs);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd, days };
}

function getSlugFromPath(path: string) {
  if (!path.startsWith("/works/") && !path.startsWith("/proyectos/")) return "";
  const parts = path.split("/");
  return parts[2] ?? "";
}

function computeSeries(
  period: DashboardPeriod,
  events: AnalyticsEventRow[],
  contacts: LeadRow[],
): DashboardPayload["series"] {
  const buckets = new Map<
    string,
    {
      label: string;
      pageViews: number;
      contacts: number;
      ctaClicks: number;
      visitors: Set<string>;
    }
  >();

  function ensure(dateValue: string) {
    const date = new Date(dateValue);
    const key = bucketKey(date, period);
    const label = formatBucket(date, period);
    const existing = buckets.get(key);
    if (existing) return existing;
    const next = { label, pageViews: 0, contacts: 0, ctaClicks: 0, visitors: new Set<string>() };
    buckets.set(key, next);
    return next;
  }

  for (const event of events) {
    const bucket = ensure(event.created_at);
    if (event.event_type === "page_view") bucket.pageViews += 1;
    if (event.event_type === "cta_click") bucket.ctaClicks += 1;
    bucket.visitors.add(event.visitor_id);
  }

  for (const lead of contacts) {
    const bucket = ensure(lead.created_at);
    bucket.contacts += 1;
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => {
      const visitors = value.visitors.size;
      const conversion = visitors > 0 ? (value.contacts / visitors) * 100 : 0;
      return {
        label: value.label,
        pageViews: value.pageViews,
        contacts: value.contacts,
        ctaClicks: value.ctaClicks,
        visitors,
        conversion,
      };
    });
}

function aggregateRange(events: AnalyticsEventRow[], contacts: LeadRow[]) {
  const visitorSet = new Set(events.map((event) => event.visitor_id));
  const sessionSet = new Set(events.map((event) => event.session_id));
  const pageViews = events.filter((event) => event.event_type === "page_view").length;
  const ctaClicks = events.filter((event) => event.event_type === "cta_click").length;
  const contactsCount = contacts.length;
  const conversion = visitorSet.size > 0 ? (contactsCount / visitorSet.size) * 100 : 0;

  return {
    visitors: visitorSet.size,
    sessions: sessionSet.size,
    pageViews,
    contacts: contactsCount,
    ctaClicks,
    conversion,
  };
}

function aggregateFromDailyRollups(rows: DailyRollupRow[]) {
  const total = rows.reduce(
    (acc, row) => {
      acc.visitors += Number(row.unique_visitors ?? 0);
      acc.sessions += Number(row.sessions ?? 0);
      acc.pageViews += Number(row.page_views ?? 0);
      acc.contacts += Number(row.contacts ?? 0);
      acc.ctaClicks += Number(row.cta_clicks ?? 0);
      return acc;
    },
    { visitors: 0, sessions: 0, pageViews: 0, contacts: 0, ctaClicks: 0 },
  );
  const conversion = total.visitors > 0 ? (total.contacts / total.visitors) * 100 : 0;
  return { ...total, conversion };
}

function seriesFromDailyRollups(
  rows: DailyRollupRow[],
  period: DashboardPeriod,
): DashboardPayload["series"] {
  if (period === "6m") {
    const weekly = new Map<
      string,
      { label: string; pageViews: number; contacts: number; ctaClicks: number; visitors: number }
    >();
    for (const row of rows) {
      const date = new Date(row.date);
      const day = date.getDay() || 7;
      const monday = new Date(date);
      monday.setDate(monday.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);
      const current =
        weekly.get(key) ??
        {
          label: monday.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
          pageViews: 0,
          contacts: 0,
          ctaClicks: 0,
          visitors: 0,
        };
      current.pageViews += Number(row.page_views ?? 0);
      current.contacts += Number(row.contacts ?? 0);
      current.ctaClicks += Number(row.cta_clicks ?? 0);
      current.visitors += Number(row.unique_visitors ?? 0);
      weekly.set(key, current);
    }

    return [...weekly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => ({
        ...value,
        conversion: value.visitors > 0 ? (value.contacts / value.visitors) * 100 : 0,
      }));
  }

  return rows
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row) => ({
      label: new Date(row.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      pageViews: Number(row.page_views ?? 0),
      contacts: Number(row.contacts ?? 0),
      ctaClicks: Number(row.cta_clicks ?? 0),
      visitors: Number(row.unique_visitors ?? 0),
      conversion:
        Number(row.unique_visitors ?? 0) > 0
          ? (Number(row.contacts ?? 0) / Number(row.unique_visitors ?? 0)) * 100
          : 0,
    }));
}

function aggregateFromMonthlyRollups(rows: MonthlyRollupRow[]) {
  const total = rows.reduce(
    (acc, row) => {
      acc.visitors += Number(row.unique_visitors ?? 0);
      acc.sessions += Number(row.sessions ?? 0);
      acc.pageViews += Number(row.page_views ?? 0);
      acc.contacts += Number(row.contacts ?? 0);
      acc.ctaClicks += Number(row.cta_clicks ?? 0);
      return acc;
    },
    { visitors: 0, sessions: 0, pageViews: 0, contacts: 0, ctaClicks: 0 },
  );
  const conversion = total.visitors > 0 ? (total.contacts / total.visitors) * 100 : 0;
  return { ...total, conversion };
}

function seriesFromMonthlyRollups(rows: MonthlyRollupRow[]): DashboardPayload["series"] {
  return rows
    .slice()
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((row) => ({
      label: new Date(row.month).toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
      pageViews: Number(row.page_views ?? 0),
      contacts: Number(row.contacts ?? 0),
      ctaClicks: Number(row.cta_clicks ?? 0),
      visitors: Number(row.unique_visitors ?? 0),
      conversion:
        Number(row.unique_visitors ?? 0) > 0
          ? (Number(row.contacts ?? 0) / Number(row.unique_visitors ?? 0)) * 100
          : 0,
    }));
}

function buildPlatformCards(
  snapshots: UsageSnapshotRow[],
  settings: AdminPanelSettings,
): DashboardPayload["usage"] {
  const preferredMetricByPlatform: Record<PlatformCard["platform"], string[]> = {
    email: ["emails_sent_month_used", "emails_sent_today_used"],
    cloudflare_r2: ["r2_storage_used", "r2_objects_used"],
    vercel: ["vercel_deployments_30d_used", "vercel_deployments_30d_success_used"],
    supabase: ["supabase_db_size_used", "supabase_storage_used", "supabase_mau_used"],
  };

  const byPlatform = new Map<string, UsageSnapshotRow[]>();
  for (const row of snapshots) {
    const list = byPlatform.get(row.platform) ?? [];
    list.push(row);
    byPlatform.set(row.platform, list);
  }

  const platforms: Array<PlatformCard["platform"]> = [
    "vercel",
    "supabase",
    "cloudflare_r2",
    "email",
  ];

  return platforms.map((platform) => {
    const metrics = (byPlatform.get(platform) ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    if (!metrics.length) {
      return {
        platform,
        used: 0,
        limit: null,
        unit: "sin datos",
        percent: null,
        status: "sin_datos",
        dataMode: "sin_datos",
        source: "sin_datos",
        lastSync: null,
        projection: null,
        notes: "Aún no hay sincronizaciones para esta plataforma.",
        missingCredentials: [],
      };
    }

    const preferred = preferredMetricByPlatform[platform];
    const usedMetric =
      preferred.map((key) => metrics.find((row) => row.metric_key === key)).find(Boolean) ??
      metrics.find((row) => row.metric_key.includes("used")) ??
      metrics[0];
    const source = usedMetric?.source ?? "sin_datos";
    const mode = sourceMode(source);
    const missingCredentialsRaw = (usedMetric?.meta_json as Record<string, unknown>)?.missing_credentials;
    const missingCredentials = Array.isArray(missingCredentialsRaw)
      ? missingCredentialsRaw.filter((item): item is string => typeof item === "string")
      : [];
    const limitRaw = Number((usedMetric?.meta_json as Record<string, unknown>)?.limit ?? NaN);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null;
    const used = Number(usedMetric?.metric_value ?? 0);
    const percent = limit ? (used / limit) * 100 : null;

    const warning = settings.usage_warning_threshold;
    const danger = settings.usage_danger_threshold;
    let status = severityFromPercent(percent);
    if (percent !== null) {
      if (percent >= danger + 10) status = "rojo";
      else if (percent >= danger) status = "naranja";
      else if (percent >= warning) status = "amarillo";
      else status = "verde";
    }

    return {
      platform,
      used,
      limit,
      unit: usedMetric?.metric_unit ?? "valor",
      percent,
      status,
      dataMode: mode,
      source,
      lastSync: metrics[0]?.created_at ?? null,
      projection: null,
      notes:
        (usedMetric?.meta_json as Record<string, unknown>)?.note?.toString() ??
        "Métrica sincronizada desde el backend.",
      missingCredentials,
    };
  });
}

export async function syncUsageSnapshots(
  supabase: SupabaseClient<Database>,
  _options?: { userId?: string },
) {
  const settings = await getAdminPanelSettings(supabase).catch(() => defaultAdminPanelSettings);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const rollupFromDate = new Date(now.getTime() - 400 * dayMs)
    .toISOString()
    .slice(0, 10);
  const db = domainDb(supabase);

  const [emailDay, emailMonth, assetsCount, assetsSum] =
    await Promise.all([
      db
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfToday.toISOString()),
      db
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString()),
      supabase.from("cms_assets").select("id", { count: "exact", head: true }),
      supabase.from("cms_assets").select("file_size"),
    ]);

  const fallbackStorageBytes = (assetsSum.data ?? []).reduce(
    (acc, item) => acc + Number(item.file_size ?? 0),
    0,
  );
  const fallbackObjects = Number(assetsCount.count ?? 0);

  const [r2Usage, vercelUsage] = await Promise.all([
    getR2UsageSummary({ maxPages: 400, pageSize: 1000 }).catch(() => null),
    fetchVercelUsage().catch(() => null),
  ]);
  const supabaseUsage = await fetchSupabaseUsage(supabase).catch(() => null);
  const vercelMissingCredentials = [
    !process.env.VERCEL_API_TOKEN ? "VERCEL_API_TOKEN" : null,
    !process.env.VERCEL_PROJECT_ID ? "VERCEL_PROJECT_ID" : null,
  ].filter((value): value is string => Boolean(value));

  await refreshAnalyticsRollups(supabase, rollupFromDate).catch(() => null);

  const r2StorageBytes = r2Usage?.bytes ?? fallbackStorageBytes;
  const r2Objects = r2Usage?.objects ?? fallbackObjects;
  const r2Source = r2Usage ? "r2_api" : "interno";
  const r2MissingCredentials = [
    !process.env.R2_ACCOUNT_ID ? "R2_ACCOUNT_ID" : null,
    !process.env.R2_ACCESS_KEY_ID ? "R2_ACCESS_KEY_ID" : null,
    !process.env.R2_SECRET_ACCESS_KEY ? "R2_SECRET_ACCESS_KEY" : null,
    !process.env.R2_BUCKET ? "R2_BUCKET" : null,
  ].filter((value): value is string => Boolean(value));
  const r2Note = r2Usage
    ? `Lectura real del bucket ${r2Usage.bucket}${r2Usage.sampled ? " (muestreo por paginación)" : ""}.`
    : "Estimación interna con recursos registrados en cms_assets.";

  const snapshotRows: Array<TablesInsert<"platform_usage_snapshots">> = [
    {
      platform: "email",
      metric_key: "emails_sent_today_used",
      metric_value: Number(emailDay.count ?? 0),
      metric_unit: "emails",
      period_start: startOfToday.toISOString(),
      period_end: now.toISOString(),
      source: "interno_real",
      meta_json: {
        limit: settings.email_daily_limit,
        note: "Emails de notificación enviados hoy.",
      },
    },
    {
      platform: "email",
      metric_key: "emails_sent_month_used",
      metric_value: Number(emailMonth.count ?? 0),
      metric_unit: "emails",
      period_start: startOfMonth.toISOString(),
      period_end: now.toISOString(),
      source: "interno_real",
      meta_json: {
        limit: settings.email_monthly_limit,
        note: "Emails de notificación enviados este mes.",
      },
    },
    {
      platform: "email",
      metric_key: "emails_errors_month",
      metric_value: 0,
      metric_unit: "emails",
      period_start: startOfMonth.toISOString(),
      period_end: now.toISOString(),
      source: "interno_real",
      meta_json: { note: "Errores de envío de email en el mes actual." },
    },
    {
      platform: "cloudflare_r2",
      metric_key: "r2_storage_used",
      metric_value: r2StorageBytes,
      metric_unit: "bytes",
      source: r2Source,
      meta_json: {
        note: r2Note,
        bucket: r2Usage?.bucket ?? null,
        missing_credentials: r2Usage ? [] : r2MissingCredentials,
      },
    },
    {
      platform: "cloudflare_r2",
      metric_key: "r2_objects_used",
      metric_value: r2Objects,
      metric_unit: "objetos",
      source: r2Source,
      meta_json: {
        note: r2Usage
          ? "Conteo real de objetos en R2."
          : "Objetos de biblioteca global registrados.",
        bucket: r2Usage?.bucket ?? null,
        missing_credentials: r2Usage ? [] : r2MissingCredentials,
      },
    },
    ...((supabaseUsage?.metrics.length ?? 0) > 0
      ? supabaseUsage!.metrics.map((metric) => ({
          platform: "supabase" as const,
          metric_key: metric.metricKey,
          metric_value: metric.metricValue,
          metric_unit: metric.metricUnit,
          source: metric.source,
          meta_json: {
            note: metric.note,
            limit: metric.limit ?? null,
            ...(metric.meta ?? {}),
            missing_credentials: supabaseUsage!.missingCredentials,
          },
        }))
      : [
          {
            platform: "supabase" as const,
            metric_key: "supabase_rows_fallback_used",
            metric_value: Number(assetsCount.count ?? 0),
            metric_unit: "filas",
            source: "fallback",
            meta_json: {
              note: "Fallback interno: no se pudieron cargar métricas reales de Supabase.",
              missing_credentials: [
                "SUPABASE_MANAGEMENT_TOKEN",
                "SUPABASE_PROJECT_REF",
              ],
            },
          },
        ]),
    {
      platform: "vercel",
      metric_key: "vercel_deployments_30d_used",
      metric_value: Number(vercelUsage?.deployments30d ?? 0),
      metric_unit: "deployments",
      source: vercelUsage ? "vercel_api" : "manual",
      meta_json: {
        note: vercelUsage
          ? "Despliegues consultados desde API de Vercel (últimos 30 días)."
          : "Conecta VERCEL_API_TOKEN y VERCEL_PROJECT_ID para métricas reales automáticas.",
        latest_deployment_at: vercelUsage?.latestDeploymentAt ?? null,
        missing_credentials: vercelUsage ? [] : vercelMissingCredentials,
      },
    },
    {
      platform: "vercel",
      metric_key: "vercel_deployments_30d_success_used",
      metric_value: Number(vercelUsage?.successfulDeployments30d ?? 0),
      metric_unit: "deployments",
      source: vercelUsage ? "vercel_api" : "manual",
      meta_json: {
        note: vercelUsage
          ? "Despliegues en estado READY (últimos 30 días)."
          : "Sin datos hasta configurar credenciales de Vercel.",
        missing_credentials: vercelUsage ? [] : vercelMissingCredentials,
      },
    },
  ];

  const uniqueMetricKeys = [...new Set(snapshotRows.map((row) => row.metric_key))];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentRows } = await supabase
    .from("platform_usage_snapshots")
    .select("platform, metric_key, metric_value, source, created_at")
    .in("metric_key", uniqueMetricKeys)
    .gte("created_at", oneHourAgo);

  const rowsToInsert = snapshotRows.filter((row) => {
    const existing = (recentRows ?? []).find(
      (item) => item.platform === row.platform && item.metric_key === row.metric_key,
    );
    if (!existing) return true;
    return !(
      Number(existing.metric_value) === Number(row.metric_value) &&
      String(existing.source ?? "") === String(row.source ?? "")
    );
  });

  const { error: snapshotError } =
    rowsToInsert.length > 0
      ? await supabase.from("platform_usage_snapshots").insert(rowsToInsert)
      : { error: null as null };

  if (snapshotError) {
    throw new Error("No se pudieron guardar los snapshots de consumo.");
  }

  const alertRows: Array<TablesInsert<"platform_alerts">> = [];
  const dailyLimit = settings.email_daily_limit;
  const monthLimit = settings.email_monthly_limit;
  const dayUsed = Number(emailDay.count ?? 0);
  const monthUsed = Number(emailMonth.count ?? 0);

  const checks = [
    {
      platform: "email" as const,
      metricKey: "emails_sent_today_used",
      used: dayUsed,
      limit: dailyLimit,
      baseMessage: "Has consumido gran parte del límite diario de emails.",
    },
    {
      platform: "email" as const,
      metricKey: "emails_sent_month_used",
      used: monthUsed,
      limit: monthLimit,
      baseMessage: "Has consumido gran parte del límite mensual de emails.",
    },
  ];

  for (const check of checks) {
    if (!check.limit || check.limit <= 0) continue;
    const percent = (check.used / check.limit) * 100;
    if (percent < settings.usage_warning_threshold) continue;
    const severity =
      percent >= 95
        ? "rojo"
        : percent >= settings.usage_danger_threshold
          ? "naranja"
          : "amarillo";
    alertRows.push({
      platform: check.platform,
      metric_key: check.metricKey,
      severity,
      threshold_percent:
        severity === "amarillo"
          ? settings.usage_warning_threshold
          : settings.usage_danger_threshold,
      current_percent: percent,
      status: "abierta",
      message: `${check.baseMessage} Uso actual: ${percent.toFixed(1)}%.`,
      help_copy:
        "Revisa los envíos automáticos y limpia pruebas repetidas para evitar sobrecostes.",
    });
  }

  await supabase
    .from("platform_alerts")
    .update({ status: "resuelta" })
    .eq("status", "abierta");

  if (alertRows.length) {
    await supabase.from("platform_alerts").insert(alertRows);
  }

  const platformSummary = ["email", "vercel", "supabase", "cloudflare_r2"].map((platform) => {
    const rows = snapshotRows.filter((row) => row.platform === platform);
    return {
      platform,
      metrics: rows.length,
      sources: [...new Set(rows.map((row) => String(row.source ?? "desconocido")))],
    };
  });

  return {
    createdSnapshots: rowsToInsert.length,
    createdAlerts: alertRows.length,
    platformSummary,
  };
}

export async function getDashboardData(
  supabase: SupabaseClient<Database>,
  period: DashboardPeriod,
): Promise<DashboardPayload> {
  const db = domainDb(supabase);
  const range = buildRange(period);
  const useDailyRollups = period === "6m";
  const useMonthlyRollups = period === "12m";
  const prevMonthStart = new Date(range.prevStart);
  prevMonthStart.setDate(1);
  const monthStart = new Date(range.start);
  monthStart.setDate(1);

  const [eventsRes, previousEventsRes, leadsRes, previousLeadsRes, currentDailyRollupRes, previousDailyRollupRes, currentMonthlyRollupRes, previousMonthlyRollupRes, snapshotsRes, alertsRes, settings] =
    await Promise.all([
      supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", range.start.toISOString())
        .lte("created_at", range.end.toISOString()),
      supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", range.prevStart.toISOString())
        .lte("created_at", range.prevEnd.toISOString()),
      db
        .from("leads")
        .select("*")
        .gte("created_at", range.start.toISOString())
        .lte("created_at", range.end.toISOString()),
      db
        .from("leads")
        .select("*")
        .gte("created_at", range.prevStart.toISOString())
        .lte("created_at", range.prevEnd.toISOString()),
      useDailyRollups
        ? supabase
            .from("analytics_daily_rollups")
            .select("*")
            .gte("date", range.start.toISOString().slice(0, 10))
            .lte("date", range.end.toISOString().slice(0, 10))
        : Promise.resolve({ data: [] as DailyRollupRow[] }),
      useDailyRollups
        ? supabase
            .from("analytics_daily_rollups")
            .select("*")
            .gte("date", range.prevStart.toISOString().slice(0, 10))
            .lte("date", range.prevEnd.toISOString().slice(0, 10))
        : Promise.resolve({ data: [] as DailyRollupRow[] }),
      useMonthlyRollups
        ? supabase
            .from("analytics_monthly_rollups")
            .select("*")
            .gte("month", monthStart.toISOString().slice(0, 10))
            .lte("month", range.end.toISOString().slice(0, 10))
        : Promise.resolve({ data: [] as MonthlyRollupRow[] }),
      useMonthlyRollups
        ? supabase
            .from("analytics_monthly_rollups")
            .select("*")
            .gte("month", prevMonthStart.toISOString().slice(0, 10))
            .lte("month", range.prevEnd.toISOString().slice(0, 10))
        : Promise.resolve({ data: [] as MonthlyRollupRow[] }),
      supabase
        .from("platform_usage_snapshots")
        .select("*")
        .gte("created_at", new Date(Date.now() - 60 * dayMs).toISOString())
        .order("created_at", { ascending: false })
        .limit(250),
      supabase
        .from("platform_alerts")
        .select("*")
        .eq("status", "abierta")
        .order("created_at", { ascending: false })
        .limit(30),
      getAdminPanelSettings(supabase).catch(() => defaultAdminPanelSettings),
    ]);

  const events = eventsRes.data ?? [];
  const previousEvents = previousEventsRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const previousLeads = previousLeadsRes.data ?? [];
  const currentDailyRollups = currentDailyRollupRes.data ?? [];
  const previousDailyRollups = previousDailyRollupRes.data ?? [];
  const currentMonthlyRollups = currentMonthlyRollupRes.data ?? [];
  const previousMonthlyRollups = previousMonthlyRollupRes.data ?? [];
  const snapshots = snapshotsRes.data ?? [];
  const alerts = alertsRes.data ?? [];

  const current =
    useMonthlyRollups && currentMonthlyRollups.length
      ? aggregateFromMonthlyRollups(currentMonthlyRollups)
      : useDailyRollups && currentDailyRollups.length
        ? aggregateFromDailyRollups(currentDailyRollups)
        : aggregateRange(events, leads);
  const previous =
    useMonthlyRollups && previousMonthlyRollups.length
      ? aggregateFromMonthlyRollups(previousMonthlyRollups)
      : useDailyRollups && previousDailyRollups.length
        ? aggregateFromDailyRollups(previousDailyRollups)
        : aggregateRange(previousEvents, previousLeads);

  const topPagesMap = new Map<string, number>();
  const topProjectsMap = new Map<string, number>();
  const topSourcesMap = new Map<string, number>();
  const devicesMap = new Map<string, number>();
  const countriesMap = new Map<string, number>();

  for (const event of events) {
    if (event.event_type === "page_view") {
      topPagesMap.set(event.path, (topPagesMap.get(event.path) ?? 0) + 1);
    }
    if (event.event_type === "project_view") {
      const slug = getSlugFromPath(event.path) || "sin-slug";
      topProjectsMap.set(slug, (topProjectsMap.get(slug) ?? 0) + 1);
    }
    const src = event.utm_source || "directo";
    topSourcesMap.set(src, (topSourcesMap.get(src) ?? 0) + 1);
    const device = event.device_type || "desconocido";
    devicesMap.set(device, (devicesMap.get(device) ?? 0) + 1);
    const country = event.country || "desconocido";
    countriesMap.set(country, (countriesMap.get(country) ?? 0) + 1);
  }

  const speedSnapshot = snapshots.find(
    (row) => row.platform === "vercel" && row.metric_key === "speed_insights_score",
  );
  const speedScore = speedSnapshot ? Number(speedSnapshot.metric_value) : null;
  const performanceStatus: "correcto" | "vigilar" | "problema" =
    speedScore === null ? "vigilar" : speedScore >= 90 ? "correcto" : speedScore >= 70 ? "vigilar" : "problema";

  return {
    period,
    updatedAt: new Date().toISOString(),
    summary: {
      visitors: computeDelta(current.visitors, previous.visitors),
      sessions: computeDelta(current.sessions, previous.sessions),
      pageViews: computeDelta(current.pageViews, previous.pageViews),
      contacts: computeDelta(current.contacts, previous.contacts),
      conversion: computeDelta(current.conversion, previous.conversion),
      ctaClicks: computeDelta(current.ctaClicks, previous.ctaClicks),
    },
    series:
      useMonthlyRollups && currentMonthlyRollups.length
        ? seriesFromMonthlyRollups(currentMonthlyRollups)
        : useDailyRollups && currentDailyRollups.length
          ? seriesFromDailyRollups(currentDailyRollups, period)
          : computeSeries(period, events, leads),
    topPages: toTopList(topPagesMap),
    topProjects: toTopList(topProjectsMap),
    topSources: toTopList(topSourcesMap),
    devices: toTopList(devicesMap),
    countries: toTopList(countriesMap),
    performance: {
      status: performanceStatus,
      score: speedScore,
      note:
        speedScore === null
          ? "Sin integración externa de Core Web Vitals. Conecta Vercel Speed Insights para detalle."
          : "Estado basado en el último snapshot disponible.",
    },
    usage: buildPlatformCards(snapshots, settings),
    alerts,
  };
}
