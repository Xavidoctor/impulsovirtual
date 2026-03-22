import "server-only";

import type { FAQEntity } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type FaqRow = Tables<"faqs">;
type FaqInsert = TablesInsert<"faqs">;
type FaqUpdate = TablesUpdate<"faqs">;

export type CreateFaqInput = Omit<FaqInsert, "id" | "created_at">;
export type UpdateFaqInput = Omit<FaqUpdate, "id" | "created_at">;

function mapFaqRow(row: FaqRow): FAQEntity {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    sort_order: row.sort_order,
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
  };
}

export async function listFaqs(
  options: { includeUnpublished?: boolean } = {},
  supabase?: DomainSupabaseClient,
): Promise<FAQEntity[]> {
  const includeUnpublished = options.includeUnpublished ?? false;
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  let query = db
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map(mapFaqRow);
}

export async function createFaq(
  input: CreateFaqInput,
  supabase?: DomainSupabaseClient,
): Promise<FAQEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("faqs").insert(input).select("*").single();
  if (error || !data) return null;

  return mapFaqRow(data);
}

export async function updateFaqById(
  id: string,
  input: UpdateFaqInput,
  supabase?: DomainSupabaseClient,
): Promise<FAQEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("faqs").update(input).eq("id", id).select("*").single();
  if (error || !data) return null;

  return mapFaqRow(data);
}

export async function deleteFaqById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error } = await db.from("faqs").delete().eq("id", id);
  return !error;
}
