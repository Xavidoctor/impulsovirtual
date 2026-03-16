import "server-only";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/src/types/database.types";

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function listSections(
  supabase: ServerSupabase,
  pageKey?: string,
  status?: "draft" | "published" | "archived",
) {
  let query = supabase
    .from("site_sections")
    .select("*")
    .order("page_key", { ascending: true })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (pageKey) {
    query = query.eq("page_key", pageKey);
  }

  if (status) {
    query = query.eq("status", status);
  }

  return query;
}

export async function upsertSection(
  supabase: ServerSupabase,
  payload: TablesInsert<"site_sections">,
) {
  return supabase
    .from("site_sections")
    .upsert(payload, {
      onConflict: "page_key,section_key,status",
      ignoreDuplicates: false,
    })
    .select("*")
    .single();
}

export async function updateSectionById(
  supabase: ServerSupabase,
  id: string,
  payload: TablesUpdate<"site_sections">,
) {
  return supabase
    .from("site_sections")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteSectionById(supabase: ServerSupabase, id: string) {
  return supabase.from("site_sections").delete().eq("id", id);
}

export async function listSettings(supabase: ServerSupabase) {
  return supabase.from("site_settings").select("*").order("key", { ascending: true });
}

export async function upsertSetting(
  supabase: ServerSupabase,
  payload: TablesInsert<"site_settings">,
) {
  return supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "key" })
    .select("*")
    .single();
}

export async function listProjects(
  supabase: ServerSupabase,
  filters?: { status?: "draft" | "published" | "archived"; search?: string },
) {
  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const term = filters.search.replace(/[%_]/g, "").trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%,category.ilike.%${term}%`);
    }
  }

  return query;
}

export async function getProjectById(supabase: ServerSupabase, projectId: string) {
  return supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
}

export async function createProject(
  supabase: ServerSupabase,
  payload: TablesInsert<"projects">,
) {
  return supabase.from("projects").insert(payload).select("*").single();
}

export async function updateProject(
  supabase: ServerSupabase,
  projectId: string,
  payload: TablesUpdate<"projects">,
) {
  return supabase.from("projects").update(payload).eq("id", projectId).select("*").single();
}

export async function deleteProjectById(supabase: ServerSupabase, projectId: string) {
  return supabase.from("projects").delete().eq("id", projectId);
}

export async function listProjectMedia(
  supabase: ServerSupabase,
  projectId: string,
) {
  return supabase
    .from("project_media")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function createProjectMedia(
  supabase: ServerSupabase,
  payload: TablesInsert<"project_media">,
) {
  return supabase.from("project_media").insert(payload).select("*").single();
}

export async function getProjectMediaById(
  supabase: ServerSupabase,
  mediaId: string,
) {
  return supabase.from("project_media").select("*").eq("id", mediaId).maybeSingle();
}

export async function getProjectMediaByStorageKey(
  supabase: ServerSupabase,
  storageKey: string,
) {
  return supabase
    .from("project_media")
    .select("*")
    .eq("storage_key", storageKey)
    .maybeSingle();
}

export async function deleteProjectMediaById(
  supabase: ServerSupabase,
  mediaId: string,
) {
  return supabase.from("project_media").delete().eq("id", mediaId);
}

export async function listReleases(supabase: ServerSupabase) {
  return supabase
    .from("releases")
    .select("*")
    .order("published_at", { ascending: false });
}

export async function getReleaseById(supabase: ServerSupabase, releaseId: string) {
  return supabase.from("releases").select("*").eq("id", releaseId).maybeSingle();
}

export async function createRelease(
  supabase: ServerSupabase,
  payload: TablesInsert<"releases">,
) {
  return supabase.from("releases").insert(payload).select("*").single();
}
