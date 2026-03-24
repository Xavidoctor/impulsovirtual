"use client";

import { useEffect, useMemo, useState } from "react";

import type { QuoteRequestEntity, QuoteRequestStatus } from "@/src/types/entities";

function statusLabel(status: QuoteRequestStatus) {
  if (status === "new") return "Nuevo";
  if (status === "contacted") return "Contactado";
  if (status === "qualified") return "Cualificado";
  if (status === "proposal_sent") return "Propuesta enviada";
  if (status === "closed_won") return "Cerrado (ganado)";
  return "Cerrado (perdido)";
}

function statusClasses(status: QuoteRequestStatus) {
  if (status === "new") return "border-sky-300/35 bg-sky-500/10 text-sky-200";
  if (status === "contacted") return "border-indigo-300/35 bg-indigo-500/10 text-indigo-200";
  if (status === "qualified") return "border-emerald-300/35 bg-emerald-500/10 text-emerald-200";
  if (status === "proposal_sent") return "border-amber-300/35 bg-amber-500/10 text-amber-200";
  if (status === "closed_won") return "border-emerald-300/35 bg-emerald-500/10 text-emerald-200";
  return "border-white/20 bg-white/10 text-neutral-200";
}

export function QuoteRequestsManager({
  initialItems,
}: {
  initialItems: QuoteRequestEntity[];
}) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuoteRequestStatus>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const searchable = `${item.full_name} ${item.email} ${item.company ?? ""} ${
        item.project_type ?? ""
      } ${item.project_summary} ${item.notes ?? ""}`.toLowerCase();
      const matchesSearch = !term || searchable.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setNotesDraft(selected?.notes ?? "");
  }, [selected?.notes, selectedId]);

  async function refreshItems() {
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (statusFilter !== "all") query.set("status", statusFilter);
    const response = await fetch(`/api/admin/quote-requests?${query.toString()}`, {
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudieron recargar las solicitudes.");
    }
    setItems(payload.data ?? []);
  }

  async function updateItem(
    id: string,
    patch: { status?: QuoteRequestStatus; notes?: string },
    successMessage: string,
  ) {
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/quote-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar la solicitud.");
      }
      setItems((prev) => prev.map((item) => (item.id === id ? payload.data : item)));
      setMessage(successMessage);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Solicitudes de propuesta</h1>
        <p className="text-sm text-neutral-400">
          Gestiona solicitudes comerciales y su avance en el proceso.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="w-full max-w-md space-y-1 text-sm">
            <span className="text-neutral-300">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, email, empresa o proyecto"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | QuoteRequestStatus)}
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="qualified">Cualificado</option>
              <option value="proposal_sent">Propuesta enviada</option>
              <option value="closed_won">Cerrado (ganado)</option>
              <option value="closed_lost">Cerrado (perdido)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void refreshItems()}
            className="rounded-md border border-white/15 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5"
          >
            Recargar
          </button>
        </div>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Proyecto</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer transition-colors hover:bg-white/[0.04] ${
                    selectedId === item.id ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-neutral-200">{item.full_name}</td>
                  <td className="px-3 py-2 text-neutral-300">{item.email}</td>
                  <td className="px-3 py-2 text-neutral-300">{item.project_type || "Sin especificar"}</td>
                  <td className="px-3 py-2 text-neutral-400">
                    {new Date(item.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${statusClasses(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-neutral-400">
                    No hay solicitudes para este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-lg border border-white/10 bg-black/25 p-4">
          {selected ? (
            <>
              <div className="space-y-1">
                <h2 className="font-display text-2xl tracking-wide">{selected.full_name}</h2>
                <p className="text-xs text-neutral-400">
                  {selected.email} · {new Date(selected.created_at).toLocaleString("es-ES")}
                </p>
                {selected.phone ? (
                  <p className="text-sm text-neutral-400">Teléfono: {selected.phone}</p>
                ) : null}
                {selected.company ? (
                  <p className="text-sm text-neutral-400">Empresa: {selected.company}</p>
                ) : null}
              </div>

              <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-neutral-300">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">Contexto</p>
                <p>Tipo: {selected.project_type || "Sin especificar"}</p>
                <p>Presupuesto: {selected.budget_range || "No indicado"}</p>
                <p>Fecha objetivo: {selected.deadline || "No indicada"}</p>
              </div>

              <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-neutral-300">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Servicios solicitados
                </p>
                <p>
                  {selected.requested_services.length > 0
                    ? selected.requested_services.join(", ")
                    : "No especificados"}
                </p>
              </div>

              <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-neutral-300">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Resumen del proyecto
                </p>
                <p className="whitespace-pre-wrap">{selected.project_summary}</p>
              </div>

              {selected.references ? (
                <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-neutral-300">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">
                    Referencias
                  </p>
                  <p className="whitespace-pre-wrap">{selected.references}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(selected.id, { status: "contacted" }, "Solicitud marcada como contactada.")
                  }
                  className="rounded-md border border-indigo-300/30 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/10 disabled:cursor-not-allowed"
                >
                  Contactado
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(selected.id, { status: "qualified" }, "Solicitud marcada como cualificada.")
                  }
                  className="rounded-md border border-emerald-300/30 px-3 py-1.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed"
                >
                  Cualificado
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(selected.id, { status: "proposal_sent" }, "Estado actualizado a propuesta enviada.")
                  }
                  className="rounded-md border border-amber-300/30 px-3 py-1.5 text-xs text-amber-200 transition-colors hover:bg-amber-500/10 disabled:cursor-not-allowed"
                >
                  Propuesta enviada
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(selected.id, { status: "closed_won" }, "Solicitud cerrada como ganada.")
                  }
                  className="rounded-md border border-emerald-300/30 px-3 py-1.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed"
                >
                  Cerrar ganado
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(selected.id, { status: "closed_lost" }, "Solicitud cerrada como perdida.")
                  }
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
                >
                  Cerrar perdido
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(selected.id, { status: "new" }, "Solicitud devuelta a nuevo.")
                  }
                  className="rounded-md border border-sky-300/30 px-3 py-1.5 text-xs text-sky-200 transition-colors hover:bg-sky-500/10 disabled:cursor-not-allowed"
                >
                  Marcar nuevo
                </button>
              </div>

              <div className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
                <label className="text-xs uppercase tracking-[0.1em] text-neutral-400">
                  Notas internas
                </label>
                <textarea
                  rows={4}
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  placeholder="Notas para seguimiento comercial..."
                  className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-neutral-200"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateItem(
                      selected.id,
                      { notes: notesDraft },
                      "Notas internas actualizadas.",
                    )
                  }
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
                >
                  Guardar notas
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              Selecciona una solicitud para ver su detalle.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

