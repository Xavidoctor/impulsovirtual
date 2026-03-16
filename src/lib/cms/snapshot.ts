import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/src/types/database.types";
import { releaseSnapshotSchema } from "@/src/lib/validators/release-schema";

export type CmsSnapshot = {
  capturedAt: string;
  siteSections: Tables<"site_sections">[];
  siteSettings: Tables<"site_settings">[];
  projects: Tables<"projects">[];
  projectMedia: Tables<"project_media">[];
};

async function readTableOrThrow<T>(
  promise: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  tableName: string,
) {
  const { data, error } = await promise;
  if (error) {
    throw new Error(`Failed to read ${tableName}: ${error.message}`);
  }
  return data ?? [];
}

export async function buildCmsSnapshot(
  supabase: SupabaseClient<Database>,
): Promise<CmsSnapshot> {
  const [siteSections, siteSettings, projects, projectMedia] = await Promise.all([
    readTableOrThrow(
      supabase.from("site_sections").select("*").order("updated_at", { ascending: true }),
      "site_sections",
    ),
    readTableOrThrow(
      supabase.from("site_settings").select("*").order("key", { ascending: true }),
      "site_settings",
    ),
    readTableOrThrow(
      supabase.from("projects").select("*").order("updated_at", { ascending: true }),
      "projects",
    ),
    readTableOrThrow(
      supabase.from("project_media").select("*").order("created_at", { ascending: true }),
      "project_media",
    ),
  ]);

  return {
    capturedAt: new Date().toISOString(),
    siteSections,
    siteSettings,
    projects,
    projectMedia,
  };
}

export function parseReleaseSnapshot(rawSnapshot: unknown): CmsSnapshot {
  const parsed = releaseSnapshotSchema.parse(rawSnapshot);
  return parsed as CmsSnapshot;
}
