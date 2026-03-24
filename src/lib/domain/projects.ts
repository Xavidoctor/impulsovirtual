import "server-only";

import type { ProjectEntity, ProjectMediaEntity, ProjectStatus } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

export type ProjectWithMedia = ProjectEntity & {
  media: ProjectMediaEntity[];
};

type ProjectRow = Tables<"projects">;
type ProjectMediaRow = Tables<"project_media">;
type ProjectInsert = TablesInsert<"projects">;
type ProjectUpdate = TablesUpdate<"projects">;
type ProjectMediaInsert = TablesInsert<"project_media">;
type ProjectMediaUpdate = TablesUpdate<"project_media">;

export type CreateProjectInput = Omit<ProjectInsert, "id" | "created_at" | "updated_at">;
export type UpdateProjectInput = Omit<ProjectUpdate, "id" | "created_at" | "updated_at">;
export type UpdateProjectMediaInput = Omit<ProjectMediaUpdate, "id" | "created_at">;

function normalizeProjectStatus(value: string | null | undefined): ProjectStatus {
  return value === "in_progress" ? "in_progress" : "completed";
}

function normalizePreviewMode(
  value: string | null | undefined,
): "embed" | "image" {
  if (value === "image" || value === "external_only") return "image";
  return "embed";
}

function mapProjectRow(row: ProjectRow): ProjectEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    client_name: row.client_name,
    excerpt: row.excerpt ?? "",
    description: row.description,
    challenge: row.challenge,
    solution: row.solution,
    results: row.results,
    cover_image_url: row.cover_image_url,
    company_logo_url: row.company_logo_url ?? null,
    website_url: row.website_url ?? row.live_url ?? null,
    live_url: row.live_url ?? row.website_url ?? null,
    featured: Boolean(row.featured),
    status: normalizeProjectStatus(row.status),
    progress_percentage: row.progress_percentage ?? null,
    progress_label: row.progress_label ?? null,
    progress_note: row.progress_note ?? null,
    project_orientation: row.project_orientation ?? null,
    what_was_done: row.what_was_done ?? null,
    services_applied: row.services_applied ?? [],
    preview_mode: normalizePreviewMode(row.preview_mode),
    preview_image_url: row.preview_image_url ?? null,
    is_published: row.is_published,
    published_at: row.published_at,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapProjectMediaRow(row: ProjectMediaRow): ProjectMediaEntity {
  return {
    id: row.id,
    project_id: row.project_id,
    file_url: row.public_url,
    alt: row.alt_text,
    caption: row.caption,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

async function listProjectRows(
  options: { includeUnpublished?: boolean; status?: ProjectStatus },
  supabase?: DomainSupabaseClient,
): Promise<ProjectRow[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];
  const includeUnpublished = options.includeUnpublished ?? false;

  const baseQuery = db
    .from("projects")
    .select("*")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const withStatusFilter = options.status
    ? baseQuery.eq("status", options.status)
    : baseQuery;

  if (includeUnpublished) {
    const { data, error } = await withStatusFilter;
    if (error) return [];
    return data ?? [];
  }

  const published = await withStatusFilter.eq("is_published", true);
  if (published.error) return [];
  return published.data ?? [];
}

export async function listProjects(
  options: { includeUnpublished?: boolean; includeMedia?: boolean; status?: ProjectStatus } = {},
  supabase?: DomainSupabaseClient,
): Promise<ProjectWithMedia[]> {
  const rows = await listProjectRows(options, supabase);
  const projects: ProjectEntity[] = rows.map(mapProjectRow);

  if (!options.includeMedia) {
    return projects.map((project) => ({ ...project, media: [] }));
  }

  if (!projects.length) return [];
  const db = getOptionalDomainClient(supabase);
  if (!db) return projects.map((project) => ({ ...project, media: [] }));

  const ids = projects.map((project) => project.id);
  const { data: mediaRows, error } = await db
    .from("project_media")
    .select("*")
    .in("project_id", ids)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return projects.map((project) => ({ ...project, media: [] }));
  }

  const grouped = new Map<string, ProjectMediaEntity[]>();
  for (const rawRow of mediaRows ?? []) {
    const mapped = mapProjectMediaRow(rawRow);
    const list = grouped.get(mapped.project_id) ?? [];
    list.push(mapped);
    grouped.set(mapped.project_id, list);
  }

  return projects.map((project) => ({
    ...project,
    media: grouped.get(project.id) ?? [],
  }));
}

export async function getProjectBySlug(
  slug: string,
  options: { includeUnpublished?: boolean; includeMedia?: boolean } = {},
  supabase?: DomainSupabaseClient,
): Promise<ProjectWithMedia | null> {
  const projects = await listProjects(options, supabase);
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getProjectById(
  id: string,
  options: { includeMedia?: boolean } = {},
  supabase?: DomainSupabaseClient,
): Promise<ProjectWithMedia | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("projects").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  const mapped = mapProjectRow(data);
  if (!options.includeMedia) {
    return { ...mapped, media: [] };
  }

  const media = await listProjectMediaByProjectId(id, db);
  return { ...mapped, media };
}

export async function createProject(
  input: CreateProjectInput,
  supabase?: DomainSupabaseClient,
): Promise<ProjectEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("projects").insert(input).select("*").single();
  if (error || !data) return null;
  return mapProjectRow(data);
}

export async function updateProjectById(
  id: string,
  input: UpdateProjectInput,
  supabase?: DomainSupabaseClient,
): Promise<ProjectEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("projects").update(input).eq("id", id).select("*").single();
  if (error || !data) return null;
  return mapProjectRow(data);
}

export async function deleteProjectById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error: mediaError } = await db.from("project_media").delete().eq("project_id", id);
  if (mediaError) return false;

  const { error } = await db.from("projects").delete().eq("id", id);
  return !error;
}

export async function listProjectMediaByProjectId(
  projectId: string,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaEntity[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  const { data, error } = await db
    .from("project_media")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapProjectMediaRow);
}

export async function createProjectMedia(
  input: ProjectMediaInsert,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("project_media").insert(input).select("*").single();
  if (error || !data) return null;

  return mapProjectMediaRow(data);
}

export async function updateProjectMediaById(
  id: string,
  input: UpdateProjectMediaInput,
  supabase?: DomainSupabaseClient,
): Promise<ProjectMediaEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("project_media")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapProjectMediaRow(data);
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
