"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createDefaultSectionData,
  pageKeySchema,
  parseSectionData,
  sectionKeySchema,
  sectionStatusSchema,
} from "@/src/lib/validators/section-schemas";
import type { Tables } from "@/src/types/database.types";

type SectionRow = Tables<"site_sections">;
type PageKey = (typeof pageKeySchema)["_type"];
type SectionKey = (typeof sectionKeySchema)["_type"];
type SectionStatus = (typeof sectionStatusSchema)["_type"];
type LinkItem = { label: string; href: string };
type ImageItem = { src: string; alt: string };
type ContentStatus = "draft" | "published" | "archived";

function getStatusLabel(status: ContentStatus) {
  if (status === "draft") return "Borrador";
  if (status === "published") return "Publicado";
  return "Archivado";
}

function getPageLabel(page: PageKey) {
  if (page === "home") return "Inicio";
  if (page === "works") return "Proyectos";
  return "Global";
}

type SectionFormState = {
  id?: string;
  pageKey: PageKey;
  sectionKey: SectionKey;
  status: SectionStatus;
  position: number;
  enabled: boolean;
  data: Record<string, unknown>;
};

const sectionToPage: Record<SectionKey, PageKey> = {
  hero: "home",
  intro: "home",
  about: "home",
  expertises: "home",
  recent_works: "home",
  cta_final: "home",
  showreel: "home",
  visual_gallery: "home",
  navbar: "global",
  footer: "global",
  works_listing_header: "works",
  featured_projects: "works",
  works_ordering: "works",
};

const sectionOptions: Array<{ key: SectionKey; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "intro", label: "Introducción" },
  { key: "about", label: "Sobre mí" },
  { key: "expertises", label: "Especialidades" },
  { key: "recent_works", label: "Proyectos recientes" },
  { key: "showreel", label: "Showreel" },
  { key: "visual_gallery", label: "Galería visual" },
  { key: "cta_final", label: "CTA final" },
  { key: "navbar", label: "Navegación" },
  { key: "footer", label: "Pie de página" },
  { key: "works_listing_header", label: "Cabecera de proyectos" },
  { key: "featured_projects", label: "Proyectos destacados" },
  { key: "works_ordering", label: "Orden de proyectos" },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : ([] as string[]);
}

function asLinkArray(value: unknown) {
  if (!Array.isArray(value)) return [] as LinkItem[];
  return value
    .map((item) => {
      const obj = asRecord(item);
      const label = asString(obj.label).trim();
      const href = asString(obj.href).trim();
      return label || href ? { label, href } : null;
    })
    .filter((item): item is LinkItem => item !== null);
}

function asImageArray(value: unknown) {
  if (!Array.isArray(value)) return [] as ImageItem[];
  return value
    .map((item) => {
      const obj = asRecord(item);
      const src = asString(obj.src).trim();
      const alt = asString(obj.alt).trim();
      return src || alt ? { src, alt } : null;
    })
    .filter((item): item is ImageItem => item !== null);
}

function createInitialForm(sectionKey: SectionKey = "hero"): SectionFormState {
  return {
    pageKey: sectionToPage[sectionKey],
    sectionKey,
    status: "draft",
    position: 0,
    enabled: true,
    data: asRecord(createDefaultSectionData(sectionKey)),
  };
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-neutral-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-neutral-300">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
      />
    </label>
  );
}

function TextareaInput({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-neutral-300">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
      />
    </label>
  );
}

function StringListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-300">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...values, ""]) }
          className="rounded-md border border-white/20 px-2 py-1 text-xs"
        >
          + Añadir
        </button>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function LinkListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: LinkItem[];
  onChange: (values: LinkItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-300">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...values, { label: "", href: "" }])}
          className="rounded-md border border-white/20 px-2 py-1 text-xs"
        >
          + Añadir
        </button>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={item.label}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...next[index], label: event.target.value };
                onChange(next);
              }}
              placeholder="Etiqueta"
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={item.href}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...next[index], href: event.target.value };
                onChange(next);
              }}
              placeholder="Enlace"
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: ImageItem[];
  onChange: (values: ImageItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-300">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...values, { src: "", alt: "" }])}
          className="rounded-md border border-white/20 px-2 py-1 text-xs"
        >
          + Añadir
        </button>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={item.src}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...next[index], src: event.target.value };
                onChange(next);
              }}
              placeholder="/assets/..."
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={item.alt}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...next[index], alt: event.target.value };
                onChange(next);
              }}
              placeholder="Texto alternativo"
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionsManager() {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [form, setForm] = useState<SectionFormState>(() => createInitialForm("hero"));
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("{}");

  async function loadRows() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/sections", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar las secciones.");
      setRows(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    setRawJsonText(JSON.stringify(form.data, null, 2));
  }, [form.data, form.id, form.sectionKey]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.page_key !== b.page_key) return a.page_key.localeCompare(b.page_key);
        if (a.position !== b.position) return a.position - b.position;
        return a.section_key.localeCompare(b.section_key);
      }),
    [rows],
  );

  function setDataField(field: string, value: unknown) {
    setForm((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  }

  function resetForm() {
    setForm(createInitialForm("hero"));
    setShowAdvancedJson(false);
  }

  function changeSectionKey(sectionKey: SectionKey) {
    setForm((prev) => ({
      ...prev,
      sectionKey,
      pageKey: sectionToPage[sectionKey],
      data: asRecord(createDefaultSectionData(sectionKey)),
    }));
    setShowAdvancedJson(false);
  }

  function startEdit(row: SectionRow) {
    const keyParsed = sectionKeySchema.safeParse(row.section_key);
    if (!keyParsed.success) {
      setError(`section_key no soportado: ${row.section_key}`);
      return;
    }

    const pageParsed = pageKeySchema.safeParse(row.page_key);
    setForm({
      id: row.id,
      pageKey: pageParsed.success ? pageParsed.data : sectionToPage[keyParsed.data],
      sectionKey: keyParsed.data,
      status: row.status,
      position: row.position,
      enabled: row.enabled,
      data: asRecord(row.data_json),
    });
    setShowAdvancedJson(false);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const sourceData = showAdvancedJson ? JSON.parse(rawJsonText) : form.data;
      const parsedData = parseSectionData(form.sectionKey, sourceData);

      const response = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          pageKey: form.pageKey,
          sectionKey: form.sectionKey,
          status: form.status,
          position: form.position,
          enabled: form.enabled,
          dataJson: parsedData,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar la sección.");

      setMessage(form.id ? "Sección actualizada." : "Sección creada.");
      resetForm();
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta sección?")) return;
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/sections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo eliminar la sección.");
      setMessage("Sección eliminada.");
      if (form.id === id) resetForm();
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function shiftPosition(row: SectionRow, delta: number) {
    const keyParsed = sectionKeySchema.safeParse(row.section_key);
    const pageParsed = pageKeySchema.safeParse(row.page_key);
    if (!keyParsed.success || !pageParsed.success) return;

    try {
      const response = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          pageKey: pageParsed.data,
          sectionKey: keyParsed.data,
          status: row.status,
          position: Math.max(0, row.position + delta),
          enabled: row.enabled,
          dataJson: row.data_json,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo mover la sección.");
      setMessage("Orden actualizado.");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    }
  }

  const data = form.data;

  function renderSectionForm() {
    switch (form.sectionKey) {
      case "hero": {
        const media = asRecord(data.media);
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Etiqueta" value={asString(data.label)} onChange={(value) => setDataField("label", value)} />
              <TextInput label="Texto en movimiento" value={asString(data.marqueeText)} onChange={(value) => setDataField("marqueeText", value)} />
            </div>
            <TextareaInput label="Texto" value={asString(data.paragraph)} onChange={(value) => setDataField("paragraph", value)} />
            <StringListField label="Especialidades" values={asStringArray(data.disciplines)} onChange={(values) => setDataField("disciplines", values)} />
            <div className="grid gap-4 rounded-md border border-white/10 p-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-neutral-300">Tipo de medio</span>
                <select
                  value={asString(media.type, "video")}
                  onChange={(event) => setDataField("media", { ...media, type: event.target.value })}
                  className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                >
                  <option value="video">Vídeo</option>
                  <option value="image">Imagen</option>
                </select>
              </label>
              <TextInput label="URL de vídeo" value={asString(media.videoSrc)} onChange={(value) => setDataField("media", { ...media, videoSrc: value })} />
              <TextInput label="URL imagen" value={asString(media.imageSrc)} onChange={(value) => setDataField("media", { ...media, imageSrc: value })} />
              <TextInput label="URL poster" value={asString(media.posterSrc)} onChange={(value) => setDataField("media", { ...media, posterSrc: value })} />
              <TextInput label="Color de respaldo" value={asString(media.fallbackColor)} onChange={(value) => setDataField("media", { ...media, fallbackColor: value })} />
              <NumberInput label="Opacidad de overlay" min={0} max={1} step={0.01} value={asNumber(media.overlayOpacity, 0.4)} onChange={(value) => setDataField("media", { ...media, overlayOpacity: value })} />
              <NumberInput label="Velocidad de reproducción" min={0.25} max={2} step={0.01} value={asNumber(media.playbackRate, 0.85)} onChange={(value) => setDataField("media", { ...media, playbackRate: value })} />
              <label className="mt-6 flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={asBoolean(media.loop, true)} onChange={(event) => setDataField("media", { ...media, loop: event.target.checked })} />
                Bucle
              </label>
            </div>
          </>
        );
      }
      case "intro":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <TextareaInput label="Texto" value={asString(data.paragraph)} onChange={(value) => setDataField("paragraph", value)} />
          </div>
        );
      case "about":
        return (
          <>
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <StringListField label="Textos" values={asStringArray(data.paragraphs)} onChange={(values) => setDataField("paragraphs", values)} />
          </>
        );
      case "expertises":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
              <TextInput label="Introducción" value={asString(data.intro)} onChange={(value) => setDataField("intro", value)} />
            </div>
            <StringListField label="Especialidades" values={asStringArray(data.items)} onChange={(values) => setDataField("items", values)} />
          </>
        );
      case "recent_works":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <TextInput label="Introducción" value={asString(data.intro)} onChange={(value) => setDataField("intro", value)} />
            <label className="mt-6 flex items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" checked={asBoolean(data.showFeaturedOnly, true)} onChange={(event) => setDataField("showFeaturedOnly", event.target.checked)} />
              Mostrar solo destacados
            </label>
            <NumberInput label="Limite" min={1} max={24} value={asNumber(data.limit, 3)} onChange={(value) => setDataField("limit", value)} />
          </div>
        );
      case "cta_final":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <TextareaInput label="Texto" value={asString(data.paragraph)} onChange={(value) => setDataField("paragraph", value)} />
            <TextInput label="Etiqueta CTA" value={asString(data.ctaLabel)} onChange={(value) => setDataField("ctaLabel", value)} />
            <TextInput label="Enlace CTA" value={asString(data.ctaHref)} onChange={(value) => setDataField("ctaHref", value)} />
          </div>
        );
      case "navbar":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput label="Marca" value={asString(data.brand)} onChange={(value) => setDataField("brand", value)} />
              <TextInput label="Etiqueta copiar correo" value={asString(data.copyEmail)} onChange={(value) => setDataField("copyEmail", value)} />
              <TextInput label="Etiqueta contacto / WhatsApp" value={asString(data.contactWhatsapp)} onChange={(value) => setDataField("contactWhatsapp", value)} />
            </div>
            <LinkListField label="Enlaces" values={asLinkArray(data.links)} onChange={(values) => setDataField("links", values)} />
          </>
        );
      case "footer":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Linea de marca" value={asString(data.brandLine)} onChange={(value) => setDataField("brandLine", value)} />
              <TextInput label="Derechos de autor" value={asString(data.copyright)} onChange={(value) => setDataField("copyright", value)} />
            </div>
            <LinkListField label="Enlaces del footer" values={asLinkArray(data.links)} onChange={(values) => setDataField("links", values)} />
          </>
        );
      case "works_listing_header":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <TextareaInput label="Introducción" value={asString(data.intro)} onChange={(value) => setDataField("intro", value)} />
          </div>
        );
      case "featured_projects":
        return (
          <>
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <StringListField label="Slugs de proyectos" values={asStringArray(data.projectSlugs)} onChange={(values) => setDataField("projectSlugs", values)} />
          </>
        );
      case "works_ordering":
        return (
          <>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Modo</span>
              <select
                value={asString(data.mode, "manual")}
                onChange={(event) => setDataField("mode", event.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
              >
                <option value="manual">Manual</option>
                <option value="year_desc">Año descendente</option>
                <option value="year_asc">Año ascendente</option>
                <option value="featured_first">Destacados primero</option>
              </select>
            </label>
            {asString(data.mode, "manual") === "manual" ? (
              <StringListField label="Slugs en orden manual" values={asStringArray(data.manualOrderSlugs)} onChange={(values) => setDataField("manualOrderSlugs", values)} />
            ) : null}
          </>
        );
      case "showreel":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <TextInput label="Pie de foto" value={asString(data.caption)} onChange={(value) => setDataField("caption", value)} />
            <TextInput label="URL de vídeo" value={asString(data.videoSrc)} onChange={(value) => setDataField("videoSrc", value)} />
            <TextInput label="URL poster" value={asString(data.posterSrc)} onChange={(value) => setDataField("posterSrc", value)} />
            <NumberInput label="Opacidad de overlay" min={0} max={1} step={0.01} value={asNumber(data.overlayOpacity, 0.24)} onChange={(value) => setDataField("overlayOpacity", value)} />
          </div>
        );
      case "visual_gallery":
        return (
          <>
            <TextInput label="Titulo" value={asString(data.heading)} onChange={(value) => setDataField("heading", value)} />
            <ImageListField label="Imágenes" values={asImageArray(data.images)} onChange={(values) => setDataField("images", values)} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Secciones</h1>
        <p className="text-sm text-neutral-400">Editor visual por sección con validación Zod y modo JSON opcional.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Sección</span>
            <select value={form.sectionKey} onChange={(event) => changeSectionKey(event.target.value as SectionKey)} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2">
              {sectionOptions.map((option) => (<option key={option.key} value={option.key}>{option.label}</option>))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Página</span>
            <select value={form.pageKey} onChange={(event) => setForm((prev) => ({ ...prev, pageKey: event.target.value as PageKey }))} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2">
              <option value="home">Inicio</option><option value="works">Proyectos</option><option value="global">Global</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as SectionStatus }))} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2">
              <option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option>
            </select>
          </label>
          <NumberInput label="Posición" min={0} max={999} value={form.position} onChange={(value) => setForm((prev) => ({ ...prev, position: value }))} />
          <label className="mt-6 flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))} />
            Activo
          </label>
        </div>

        <div className="grid gap-4 border-t border-white/10 pt-4">{renderSectionForm()}</div>

        <div className="border-t border-white/10 pt-4">
          <button type="button" onClick={() => setShowAdvancedJson((prev) => !prev)} className="rounded-md border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.12em] text-neutral-300">
            {showAdvancedJson ? "Ocultar JSON avanzado" : "JSON avanzado"}
          </button>
          {showAdvancedJson ? (
            <div className="mt-3 space-y-2">
              <textarea rows={10} value={rawJsonText} onChange={(event) => setRawJsonText(event.target.value)} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs" />
              <button type="button" onClick={() => { try { const parsed = JSON.parse(rawJsonText); setForm((prev) => ({ ...prev, data: asRecord(parsed) })); setError(""); } catch { setError("JSON inválido en modo avanzado."); } }} className="rounded-md border border-white/20 px-3 py-2 text-xs">
                Aplicar JSON al formulario
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <button type="submit" disabled={isLoading} className="rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed">{form.id ? "Actualizar" : "Crear"}</button>
          {form.id ? <button type="button" onClick={resetForm} className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5">Cancelar edición</button> : null}
          <button type="button" onClick={() => void loadRows()} className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5">Recargar</button>
          {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
          {error ? <span className="text-sm text-red-300">{error}</span> : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-neutral-400">
            <tr><th className="px-3 py-2 text-left">Página</th><th className="px-3 py-2 text-left">Sección</th><th className="px-3 py-2 text-left">Estado</th><th className="px-3 py-2 text-left">Activo</th><th className="px-3 py-2 text-left">Posición</th><th className="px-3 py-2 text-left">Actualizado</th><th className="px-3 py-2 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedRows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 text-neutral-200">{getPageLabel(row.page_key as PageKey)}</td><td className="px-3 py-2 text-neutral-200">{sectionOptions.find((option) => option.key === row.section_key)?.label ?? row.section_key}</td><td className="px-3 py-2 text-neutral-300">{getStatusLabel(row.status)}</td><td className="px-3 py-2 text-neutral-300">{row.enabled ? "Sí" : "No"}</td><td className="px-3 py-2 text-neutral-300">{row.position}</td>
                <td className="px-3 py-2 text-neutral-400">{new Date(row.updated_at).toLocaleString()}</td>
                <td className="space-x-2 px-3 py-2 text-right">
                  <button type="button" onClick={() => void shiftPosition(row, -1)} className="rounded-md border border-white/15 px-2 py-1 text-xs text-neutral-300">↑</button>
                  <button type="button" onClick={() => void shiftPosition(row, 1)} className="rounded-md border border-white/15 px-2 py-1 text-xs text-neutral-300">↓</button>
                  <button type="button" onClick={() => startEdit(row)} className="rounded-md border border-white/15 px-2 py-1 text-xs text-neutral-200 transition-colors hover:bg-white/10">Editar</button>
                  <button type="button" onClick={() => void handleDelete(row.id)} className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10">Eliminar</button>
                </td>
              </tr>
            ))}
            {!sortedRows.length && !isLoading ? <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-400">No hay secciones creadas todavía.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
