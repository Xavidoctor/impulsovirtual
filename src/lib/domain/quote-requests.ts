import "server-only";

import type { QuoteRequestEntity, QuoteRequestStatus } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type QuoteRequestFilters = {
  status?: QuoteRequestStatus;
  search?: string;
  limit?: number;
};

export type CreateQuoteRequestInput = {
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  project_type?: string | null;
  requested_services?: string[];
  budget_range?: string | null;
  deadline?: string | null;
  project_summary: string;
  references?: string | null;
  status?: QuoteRequestStatus;
  notes?: string | null;
};

type QuoteRequestRow = Tables<"quote_requests">;

function mapQuoteRequestRow(row: QuoteRequestRow): QuoteRequestEntity {
  const services = Array.isArray(row.requested_services)
    ? row.requested_services.filter((item: unknown): item is string => typeof item === "string")
    : [];

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    project_type: row.project_type,
    requested_services: services,
    budget_range: row.budget_range,
    deadline: row.deadline,
    project_summary: row.project_summary,
    references: row.references,
    status: row.status as QuoteRequestStatus,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listQuoteRequests(
  filters: QuoteRequestFilters = {},
  supabase?: DomainSupabaseClient,
): Promise<QuoteRequestEntity[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];
  let query = db
    .from("quote_requests")
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
        `full_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%,project_type.ilike.%${term}%,project_summary.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map(mapQuoteRequestRow);
}

export async function createQuoteRequest(
  input: CreateQuoteRequestInput,
  supabase?: DomainSupabaseClient,
): Promise<QuoteRequestEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const payload: TablesInsert<"quote_requests"> = {
    full_name: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    company: input.company ?? null,
    project_type: input.project_type ?? null,
    requested_services: input.requested_services ?? [],
    budget_range: input.budget_range ?? null,
    deadline: input.deadline ?? null,
    project_summary: input.project_summary,
    references: input.references ?? null,
    status: input.status ?? "new",
    notes: input.notes ?? null,
  };

  const { data, error } = await db
    .from("quote_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapQuoteRequestRow(data);
}

export async function updateQuoteRequestById(
  quoteRequestId: string,
  patch: { status?: QuoteRequestStatus; notes?: string },
  supabase?: DomainSupabaseClient,
): Promise<QuoteRequestEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const nextPatch: TablesUpdate<"quote_requests"> = {};
  if (patch.status !== undefined) {
    nextPatch.status = patch.status;
  }
  if (patch.notes !== undefined) {
    nextPatch.notes = patch.notes;
  }

  const { data, error } = await db
    .from("quote_requests")
    .update(nextPatch)
    .eq("id", quoteRequestId)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapQuoteRequestRow(data);
}
