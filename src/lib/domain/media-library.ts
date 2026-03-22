import "server-only";

import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type ProjectMediaRow = Tables<"project_media">;
type CmsAssetRow = Tables<"cms_assets">;
type ProjectMediaInsert = TablesInsert<"project_media">;
type ProjectMediaUpdate = TablesUpdate<"project_media">;
type CmsAssetInsert = TablesInsert<"cms_assets">;

export async function getProjectMediaById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaRow | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("project_media")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getProjectMediaByStorageKey(
  storageKey: string,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaRow | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("project_media")
    .select("*")
    .eq("storage_key", storageKey)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getProjectMediaByPublicUrl(
  publicUrl: string,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaRow[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  const { data, error } = await db
    .from("project_media")
    .select("*")
    .eq("public_url", publicUrl);

  if (error) return [];
  return data ?? [];
}

export async function createProjectMedia(
  input: ProjectMediaInsert,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaRow | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("project_media")
    .insert(input)
    .select("*")
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateProjectMediaById(
  id: string,
  input: ProjectMediaUpdate,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaRow | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("project_media")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return null;
  return data;
}

export async function deleteProjectMediaById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error } = await db.from("project_media").delete().eq("id", id);
  return !error;
}

export async function listCmsAssets(
  options: { search?: string; kind?: "image" | "video"; limit?: number } = {},
  supabase?: DomainSupabaseClient,
): Promise<CmsAssetRow[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  let query = db
    .from("cms_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 120);

  if (options.kind) {
    query = query.eq("kind", options.kind);
  }

  if (options.search) {
    const term = options.search.replace(/[%_]/g, "").trim();
    if (term) {
      query = query.ilike("filename", `%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function createOrUpdateCmsAsset(
  input: CmsAssetInsert,
  supabase?: DomainSupabaseClient,
): Promise<CmsAssetRow | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("cms_assets")
    .upsert(input, { onConflict: "storage_key", ignoreDuplicates: false })
    .select("*")
    .single();

  if (error || !data) return null;
  return data;
}

export async function upsertCmsAssetsByPublicUrl(
  rows: CmsAssetInsert[],
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db || rows.length === 0) return false;

  const { error } = await db
    .from("cms_assets")
    .upsert(rows, { onConflict: "public_url", ignoreDuplicates: true });

  return !error;
}

export async function getCmsAssetById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<CmsAssetRow | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("cms_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function deleteCmsAssetById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error } = await db.from("cms_assets").delete().eq("id", id);
  return !error;
}
