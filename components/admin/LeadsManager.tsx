"use client";

import { useEffect, useMemo, useState } from "react";

import type { LeadEntity, LeadStatus } from "@/src/types/entities";

function statusLabel(status: LeadStatus) {
  if (status === "new") return "Nuevo";
  if (status === "contacted") return "Contactado";
  if (status === "qualified") return "Cualificado";
  if (status === "closed_won") return "Cerrado (ganado)";
  if (status === "closed_lost") return "Cerrado (perdido)";
  return "Spam";
}

function statusClasses(status: LeadStatus) {
  if (status === "new") return "border-sky-300/35 bg-sky-500/10 text-sky-200";
  if (status === "contacted") return "border-indigo-300/35 bg-indigo-500/10 text-indigo-200";
  if (status === "qualified") return "border-emerald-300/35 bg-emerald-500/10 text-emerald-200";
  if (status === "closed_won") return "border-emerald-300/35 bg-emerald-500/10 text-emerald-200";
  if (status === "closed_lost") return "border-white/20 bg-white/10 text-neutral-200";
  return "border-rose-300/35 bg-rose-500/10 text-rose-200";
}

export function LeadsManager({ initialLeads }: { initialLeads: LeadEntity[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeads[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const text = `${lead.full_name} ${lead.email} ${lead.company ?? ""} ${lead.service_interest ?? ""} ${lead.message} ${lead.notes ?? ""}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [leads, search, statusFilter]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;

  useEffect(() => {
    setNotesDraft(selectedLead?.notes ?? "");
  }, [selectedLeadId, selectedLead?.notes]);

  async function refreshLeads() {
    const response = await fetch("/api/admin/leads", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudieron recargar los leads.");
    }
    setLeads(payload.data ?? []);
  }

  async function updateLead(
    id: string,
    patch: { status?: LeadStatus; notes?: string },
    successMessage: string,
  ) {
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar el lead.");
      }
      setLeads((prev) => prev.map((lead) => (lead.id === id ? payload.data : lead)));
      setMessage(successMessage);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado al actualizar.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Leads</h1>
        <p className="text-sm text-neutral-400">
          Gestiona los contactos recibidos desde el formulario público.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="w-full max-w-md space-y-1 text-sm">
            <span className="text-neutral-300">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, email, servicio o texto"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | LeadStatus)}
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="qualified">Cualificado</option>
              <option value="closed_won">Cerrado (ganado)</option>
              <option value="closed_lost">Cerrado (perdido)</option>
              <option value="spam">Spam</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void refreshLeads()}
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
                <th className="px-3 py-2 text-left">Servicio</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`cursor-pointer transition-colors hover:bg-white/[0.04] ${
                    selectedLeadId === lead.id ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-neutral-200">{lead.full_name}</td>
                  <td className="px-3 py-2 text-neutral-300">{lead.email}</td>
                  <td className="px-3 py-2 text-neutral-300">{lead.service_interest ?? "Sin especificar"}</td>
                  <td className="px-3 py-2 text-neutral-400">
                    {new Date(lead.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${statusClasses(lead.status)}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredLeads.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-neutral-400">
                    No hay leads para este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-lg border border-white/10 bg-black/25 p-4">
          {selectedLead ? (
            <>
              <div className="space-y-1">
                <h2 className="font-display text-2xl tracking-wide">{selectedLead.full_name}</h2>
                <p className="text-xs text-neutral-400">
                  {selectedLead.email} · {new Date(selectedLead.created_at).toLocaleString("es-ES")}
                </p>
                {selectedLead.phone ? (
                  <p className="text-sm text-neutral-400">Teléfono: {selectedLead.phone}</p>
                ) : null}
                {selectedLead.company ? (
                  <p className="text-sm text-neutral-400">Empresa: {selectedLead.company}</p>
                ) : null}
                {selectedLead.source ? (
                  <p className="text-sm text-neutral-400">Fuente: {selectedLead.source}</p>
                ) : null}
              </div>

              <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-neutral-300">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">
                  Servicio de interés
                </p>
                <p>{selectedLead.service_interest ?? "Sin especificar"}</p>
              </div>

              <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-neutral-300">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-500">Mensaje</p>
                <p className="whitespace-pre-wrap">{selectedLead.message}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void updateLead(selectedLead.id, { status: "contacted" }, "Lead marcado como contactado.")}
                  className="rounded-md border border-indigo-300/30 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/10 disabled:cursor-not-allowed"
                >
                  Contactado
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void updateLead(selectedLead.id, { status: "qualified" }, "Lead marcado como cualificado.")}
                  className="rounded-md border border-emerald-300/30 px-3 py-1.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed"
                >
                  Cualificado
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void updateLead(selectedLead.id, { status: "closed_won" }, "Lead marcado como ganado.")}
                  className="rounded-md border border-emerald-300/30 px-3 py-1.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed"
                >
                  Cerrar ganado
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void updateLead(selectedLead.id, { status: "closed_lost" }, "Lead marcado como perdido.")}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
                >
                  Cerrar perdido
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void updateLead(selectedLead.id, { status: "spam" }, "Lead marcado como spam.")}
                  className="rounded-md border border-rose-300/30 px-3 py-1.5 text-xs text-rose-200 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed"
                >
                  Spam
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void updateLead(selectedLead.id, { status: "new" }, "Lead devuelto a nuevo.")}
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
                  placeholder="Añade contexto para el equipo..."
                  className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-neutral-200"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void updateLead(
                      selectedLead.id,
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
            <p className="text-sm text-neutral-400">Selecciona un lead para ver su detalle.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
