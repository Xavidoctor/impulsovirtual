import "server-only";

import type { TestimonialEntity } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type TestimonialRow = Tables<"testimonials">;
type TestimonialInsert = TablesInsert<"testimonials">;
type TestimonialUpdate = TablesUpdate<"testimonials">;

export type CreateTestimonialInput = Omit<TestimonialInsert, "id" | "created_at">;
export type UpdateTestimonialInput = Omit<TestimonialUpdate, "id" | "created_at">;

function mapTestimonialRow(row: TestimonialRow): TestimonialEntity {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    role: row.role,
    quote: row.quote,
    avatar_url: row.avatar_url,
    sort_order: row.sort_order,
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
  };
}

export async function listTestimonials(
  options: { includeUnpublished?: boolean } = {},
  supabase?: DomainSupabaseClient,
): Promise<TestimonialEntity[]> {
  const includeUnpublished = options.includeUnpublished ?? false;
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  let query = db
    .from("testimonials")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map(mapTestimonialRow);
}

export async function createTestimonial(
  input: CreateTestimonialInput,
  supabase?: DomainSupabaseClient,
): Promise<TestimonialEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("testimonials").insert(input).select("*").single();
  if (error || !data) return null;

  return mapTestimonialRow(data);
}

export async function updateTestimonialById(
  id: string,
  input: UpdateTestimonialInput,
  supabase?: DomainSupabaseClient,
): Promise<TestimonialEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("testimonials")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapTestimonialRow(data);
}

export async function deleteTestimonialById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error } = await db.from("testimonials").delete().eq("id", id);
  return !error;
}
