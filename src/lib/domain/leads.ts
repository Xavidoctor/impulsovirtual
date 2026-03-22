import "server-only";

import type { LeadEntity, LeadStatus } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

export type CreateLeadInput = {
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service_interest?: string | null;
  message: string;
  source?: string | null;
  status?: LeadStatus;
  notes?: string | null;
};

type LeadFilters = {
  search?: string;
  status?: LeadStatus;
  limit?: number;
};

type UpdateLeadInput = {
  status?: LeadStatus;
  notes?: string;
};

type LeadRow = Tables<"leads">;

function mapLeadRow(row: LeadRow): LeadEntity {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    service_interest: row.service_interest,
    message: row.message,
    source: row.source,
    status: row.status as LeadStatus,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listLeads(
  filters: LeadFilters = {},
  supabase?: DomainSupabaseClient,
): Promise<LeadEntity[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];
  let query = db
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 250);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "").trim();
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%,service_interest.ilike.%${term}%,message.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map(mapLeadRow);
}

export async function createLead(
  input: CreateLeadInput,
  supabase?: DomainSupabaseClient,
): Promise<LeadEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const payload: TablesInsert<"leads"> = {
    full_name: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    company: input.company ?? null,
    service_interest: input.service_interest ?? null,
    message: input.message,
    source: input.source ?? "web_contact_form",
    status: input.status ?? "new",
    notes: input.notes ?? null,
  };

  const { data, error } = await db
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapLeadRow(data);
}

export async function updateLeadById(
  leadId: string,
  patch: UpdateLeadInput,
  supabase?: DomainSupabaseClient,
): Promise<LeadEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;
  const nextPatch: TablesUpdate<"leads"> = {};

  if (patch.status !== undefined) {
    nextPatch.status = patch.status;
  }
  if (patch.notes !== undefined) {
    nextPatch.notes = patch.notes;
  }

  const { data, error } = await db
    .from("leads")
    .update(nextPatch)
    .eq("id", leadId)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapLeadRow(data);
}
