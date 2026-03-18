"use client";

import { useEffect, useMemo, useState } from "react";

import type { Tables } from "@/src/types/database.types";

type AssetRow = Tables<"cms_assets">;
type AssetKindFilter = "all" | "image" | "video";

type MediaLibraryPickerProps = {
  abierto: boolean;
  onClose: () => void;
  onConfirm: (assets: AssetRow[]) => void;
  titulo?: string;
  descripcion?: string;
  seleccionMultiple?: boolean;
  tipoPermitido?: AssetKindFilter;
  textoConfirmar?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES");
}

function kindLabel(kind: "image" | "video") {
  return kind === "image" ? "Imagen" : "Vídeo";
}

export function MediaLibraryPicker({
  abierto,
  onClose,
  onConfirm,
  titulo = "Biblioteca de recursos",
  descripcion = "Elige un archivo ya subido para reutilizarlo sin volver a cargarlo.",
  seleccionMultiple = false,
  tipoPermitido = "all",
  textoConfirmar = "Usar este archivo",
}: MediaLibraryPickerProps) {
  const [items, setItems] = useState<AssetRow[]>([]);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<AssetKindFilter>(tipoPermitido === "all" ? "all" : tipoPermitido);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveKind = useMemo(() => {
    if (tipoPermitido === "all") return kindFilter;
    return tipoPermitido;
  }, [kindFilter, tipoPermitido]);

  async function loadAssets() {
    if (!abierto) return;
    setIsLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (effectiveKind !== "all") query.set("kind", effectiveKind);
      query.set("limit", "180");

      const response = await fetch(`/api/admin/assets?${query.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo cargar la biblioteca.");
      }
      setItems(payload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!abierto) {
      return;
    }
    setKindFilter(tipoPermitido === "all" ? "all" : tipoPermitido);
    setSelectedIds([]);
    void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, effectiveKind, tipoPermitido]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (seleccionMultiple) {
        return prev.includes(id) ? prev.filter((current) => current !== id) : [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  }

  function handleConfirm() {
    const selected = items.filter((item) => selectedIds.includes(item.id));
    if (!selected.length) return;
    onConfirm(selected);
    setSelectedIds([]);
    onClose();
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 md:items-center">
      <div className="w-full max-w-5xl space-y-4 rounded-xl border border-white/15 bg-[#0b0b0b] p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-display text-2xl tracking-wide text-white">{titulo}</h3>
            <p className="text-sm text-neutral-400">{descripcion}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-neutral-300 transition-colors hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="w-full max-w-sm space-y-1 text-sm">
            <span className="text-neutral-300">Buscar por nombre</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ejemplo: hero-video"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>

          {tipoPermitido === "all" ? (
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Tipo</span>
              <select
                value={kindFilter}
                onChange={(event) => setKindFilter(event.target.value as AssetKindFilter)}
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="image">Imágenes</option>
                <option value="video">Vídeos</option>
              </select>
            </label>
          ) : null}

          <button
            type="button"
            onClick={() => void loadAssets()}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/10"
          >
            Buscar
          </button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3">
          {isLoading ? (
            <p className="text-sm text-neutral-400">Cargando biblioteca...</p>
          ) : items.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className={`space-y-2 rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-emerald-300/40 bg-emerald-500/10"
                        : "border-white/10 bg-black/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="overflow-hidden rounded-md border border-white/10 bg-black/40">
                      {item.kind === "image" ? (
                        <img
                          src={item.public_url}
                          alt={item.alt_text ?? item.filename}
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.public_url}
                          className="h-36 w-full object-cover"
                          muted
                          controls
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="truncate text-sm font-medium text-white">{item.filename}</p>
                      <p className="text-xs text-neutral-400">
                        {kindLabel(item.kind)} · {formatDate(item.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No hay recursos guardados para este filtro.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="text-xs text-neutral-500">
            Seleccionados: {selectedIds.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/15 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
              className="rounded-md border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-neutral-500"
            >
              {seleccionMultiple ? "Usar archivos seleccionados" : textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
