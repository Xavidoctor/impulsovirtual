"use client";

import { useEffect, useMemo, useState } from "react";

import type { Tables } from "@/src/types/database.types";

type SettingRow = Tables<"site_settings">;
type SettingKey = "contact" | "social_links" | "seo_global" | "navigation" | "whatsapp";
type LinkItem = { label: string; href: string };

type SettingsState = {
  contact: {
    heading: string;
    intro: string;
    email: string;
    contactLabel: string;
    copyEmail: string;
    whatsappLabel: string;
  };
  social_links: {
    links: LinkItem[];
  };
  seo_global: {
    title: string;
    description: string;
    ogImage: string;
  };
  navigation: {
    brand: string;
    links: LinkItem[];
  };
  whatsapp: {
    number: string;
    message: string;
  };
};

const tabs: Array<{ key: SettingKey; label: string }> = [
  { key: "contact", label: "Contacto" },
  { key: "social_links", label: "Redes sociales" },
  { key: "seo_global", label: "SEO global" },
  { key: "navigation", label: "Navegación" },
  { key: "whatsapp", label: "WhatsApp" },
];

const defaults: SettingsState = {
  contact: {
    heading: "Contacto",
    intro: "Si tienes un proyecto, escríbeme y lo vemos.",
    email: "hola@nachomasdesign.com",
    contactLabel: "Enviar correo",
    copyEmail: "Copiar correo",
    whatsappLabel: "Contactar por WhatsApp",
  },
  social_links: {
    links: [],
  },
  seo_global: {
    title: "Nacho Mas Design | Portfolio",
    description: "Portfolio de Nacho Mas Design.",
    ogImage: "/og-cover.svg",
  },
  navigation: {
    brand: "Nacho Mas Design",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Sobre mí", href: "/#sobre-mi" },
      { label: "Proyectos", href: "/works" },
    ],
  },
  whatsapp: {
    number: "34650304969",
    message:
      "Hola Nacho, he visto tu portfolio en nachomasdesign.com y me gustaria hablar contigo sobre un proyecto.",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asLinks(value: unknown, fallback: LinkItem[] = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => {
      const obj = asRecord(item);
      const label = asString(obj.label).trim();
      const href = asString(obj.href).trim();
      return label || href ? { label, href } : null;
    })
    .filter((item): item is LinkItem => item !== null);
}

function buildState(rows: SettingRow[]): SettingsState {
  const byKey = new Map(rows.map((row) => [row.key as SettingKey, asRecord(row.value_json)]));

  const contact = byKey.get("contact") ?? {};
  const social = byKey.get("social_links") ?? {};
  const seo = byKey.get("seo_global") ?? {};
  const nav = byKey.get("navigation") ?? {};
  const wa = byKey.get("whatsapp") ?? {};

  return {
    contact: {
      heading: asString(contact.heading, defaults.contact.heading),
      intro: asString(contact.intro, defaults.contact.intro),
      email: asString(contact.email, defaults.contact.email),
      contactLabel: asString(contact.contactLabel, defaults.contact.contactLabel),
      copyEmail: asString(contact.copyEmail, defaults.contact.copyEmail),
      whatsappLabel: asString(contact.whatsappLabel, defaults.contact.whatsappLabel),
    },
    social_links: {
      links: asLinks(social.links, defaults.social_links.links),
    },
    seo_global: {
      title: asString(seo.title, defaults.seo_global.title),
      description: asString(seo.description, defaults.seo_global.description),
      ogImage: asString(seo.ogImage, defaults.seo_global.ogImage),
    },
    navigation: {
      brand: asString(nav.brand, defaults.navigation.brand),
      links: asLinks(nav.links, defaults.navigation.links),
    },
    whatsapp: {
      number: asString(wa.number, defaults.whatsapp.number),
      message: asString(wa.message, defaults.whatsapp.message),
    },
  };
}

export function SettingsManager({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [values, setValues] = useState<SettingsState>(defaults);
  const [activeTab, setActiveTab] = useState<SettingKey>("contact");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rawJson = useMemo(() => JSON.stringify(values[activeTab], null, 2), [activeTab, values]);

  async function loadRows() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar los ajustes.");
      const nextRows = payload.data ?? [];
      setRows(nextRows);
      setValues(buildState(nextRows));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function saveActiveSetting() {
    if (!isAdmin) {
      setError("Solo el administrador puede actualizar ajustes globales.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: activeTab, valueJson: values[activeTab] }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar el ajuste.");
      const tabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? activeTab;
      setMessage(`Ajuste "${tabLabel}" actualizado.`);
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateLinks(target: "social_links" | "navigation", links: LinkItem[]) {
    setValues((prev) => ({ ...prev, [target]: { ...prev[target], links } }));
  }

  function renderLinksEditor(target: "social_links" | "navigation") {
    const links = values[target].links;
    return (
      <div className="space-y-2">
      <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-300">Enlaces</p>
          <button type="button" onClick={() => updateLinks(target, [...links, { label: "", href: "" }])} className="rounded-md border border-white/20 px-2 py-1 text-xs">+ Añadir</button>
        </div>
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input value={link.label} onChange={(event) => { const next = [...links]; next[index] = { ...next[index], label: event.target.value }; updateLinks(target, next); }} placeholder="Etiqueta" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
              <input value={link.href} onChange={(event) => { const next = [...links]; next[index] = { ...next[index], href: event.target.value }; updateLinks(target, next); }} placeholder="Enlace" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
              <button type="button" onClick={() => updateLinks(target, links.filter((_, i) => i !== index))} className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300">Eliminar</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Ajustes</h1>
        <p className="text-sm text-neutral-400">Editor visual para contacto, redes sociales, SEO global, navegación y WhatsApp.</p>
      </div>

      {!isAdmin ? <div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Tu rol es editor: puedes leer ajustes, pero no modificarlos.</div> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-md border px-3 py-2 text-xs uppercase tracking-[0.12em] ${activeTab === tab.key ? "border-white/30 text-white" : "border-white/15 text-neutral-300"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5">
        {activeTab === "contact" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <input value={values.contact.heading} onChange={(event) => setValues((prev) => ({ ...prev, contact: { ...prev.contact, heading: event.target.value } }))} placeholder="Título" className="rounded-md border border-white/15 bg-black/40 px-3 py-2" />
            <input value={values.contact.email} onChange={(event) => setValues((prev) => ({ ...prev, contact: { ...prev.contact, email: event.target.value } }))} placeholder="Correo electrónico" className="rounded-md border border-white/15 bg-black/40 px-3 py-2" />
            <textarea value={values.contact.intro} onChange={(event) => setValues((prev) => ({ ...prev, contact: { ...prev.contact, intro: event.target.value } }))} rows={3} placeholder="Introducción" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 md:col-span-2" />
            <input value={values.contact.contactLabel} onChange={(event) => setValues((prev) => ({ ...prev, contact: { ...prev.contact, contactLabel: event.target.value } }))} placeholder="Etiqueta de contacto" className="rounded-md border border-white/15 bg-black/40 px-3 py-2" />
            <input value={values.contact.copyEmail} onChange={(event) => setValues((prev) => ({ ...prev, contact: { ...prev.contact, copyEmail: event.target.value } }))} placeholder="Etiqueta copiar correo" className="rounded-md border border-white/15 bg-black/40 px-3 py-2" />
            <input value={values.contact.whatsappLabel} onChange={(event) => setValues((prev) => ({ ...prev, contact: { ...prev.contact, whatsappLabel: event.target.value } }))} placeholder="Etiqueta de WhatsApp" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 md:col-span-2" />
          </div>
        ) : null}

        {activeTab === "social_links" ? renderLinksEditor("social_links") : null}

        {activeTab === "seo_global" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <input value={values.seo_global.title} onChange={(event) => setValues((prev) => ({ ...prev, seo_global: { ...prev.seo_global, title: event.target.value } }))} placeholder="Título SEO" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 md:col-span-2" />
            <textarea value={values.seo_global.description} onChange={(event) => setValues((prev) => ({ ...prev, seo_global: { ...prev.seo_global, description: event.target.value } }))} rows={3} placeholder="Descripción SEO" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 md:col-span-2" />
            <input value={values.seo_global.ogImage} onChange={(event) => setValues((prev) => ({ ...prev, seo_global: { ...prev.seo_global, ogImage: event.target.value } }))} placeholder="URL de imagen OG" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 md:col-span-2" />
          </div>
        ) : null}

        {activeTab === "navigation" ? (
          <div className="space-y-4">
            <input value={values.navigation.brand} onChange={(event) => setValues((prev) => ({ ...prev, navigation: { ...prev.navigation, brand: event.target.value } }))} placeholder="Marca" className="rounded-md border border-white/15 bg-black/40 px-3 py-2" />
            {renderLinksEditor("navigation")}
          </div>
        ) : null}

        {activeTab === "whatsapp" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <input value={values.whatsapp.number} onChange={(event) => setValues((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, number: event.target.value } }))} placeholder="Número (solo dígitos)" className="rounded-md border border-white/15 bg-black/40 px-3 py-2" />
            <textarea value={values.whatsapp.message} onChange={(event) => setValues((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, message: event.target.value } }))} rows={3} placeholder="Mensaje precargado" className="rounded-md border border-white/15 bg-black/40 px-3 py-2 md:col-span-2" />
          </div>
        ) : null}

        <div className="border-t border-white/10 pt-4">
          <button type="button" onClick={() => setShowAdvanced((prev) => !prev)} className="rounded-md border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.12em] text-neutral-300">{showAdvanced ? "Ocultar JSON avanzado" : "JSON avanzado"}</button>
          {showAdvanced ? <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-3 text-xs text-neutral-300">{rawJson}</pre> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <button type="button" disabled={isLoading || !isAdmin} onClick={() => void saveActiveSetting()} className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed">Guardar {tabs.find((tab) => tab.key === activeTab)?.label ?? activeTab}</button>
          <button type="button" onClick={() => void loadRows()} className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5">Recargar</button>
          {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
          {error ? <span className="text-sm text-red-300">{error}</span> : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-neutral-400"><tr><th className="px-3 py-2 text-left">Clave</th><th className="px-3 py-2 text-left">Actualizado</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (<tr key={row.key}><td className="px-3 py-2 text-neutral-200">{row.key}</td><td className="px-3 py-2 text-neutral-400">{new Date(row.updated_at).toLocaleString()}</td></tr>))}
            {!rows.length && !isLoading ? <tr><td colSpan={2} className="px-3 py-8 text-center text-neutral-400">No hay ajustes guardados todavía.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
