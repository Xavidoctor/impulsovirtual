import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { parseReleaseSnapshot } from "@/src/lib/cms/snapshot";
import type { Tables } from "@/src/types/database.types";

type RollbackResult = {
  release: Tables<"releases">;
  restoredSectionCount: number;
  restoredProjectCount: number;
  restoredMediaCount: number;
  revalidateSlugs: string[];
};

async function clearCmsTables() {
  const admin = createSupabaseAdminClient();

  const deletions = [
    admin.from("project_media").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    admin.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    admin.from("site_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    admin.from("site_settings").delete().neq("key", "__never__"),
  ] as const;

  const results = await Promise.all(deletions);
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    throw new Error(`Failed clearing CMS tables: ${firstError.message}`);
  }
}

export async function rollbackToRelease(params: {
  releaseId: string;
}): Promise<RollbackResult> {
  const admin = createSupabaseAdminClient();

  const { data: release, error: releaseError } = await admin
    .from("releases")
    .select("*")
    .eq("id", params.releaseId)
    .maybeSingle();

  if (releaseError) {
    throw new Error(`Failed loading release: ${releaseError.message}`);
  }

  if (!release) {
    throw new Error("Release no encontrada.");
  }

  const snapshot = parseReleaseSnapshot(release.snapshot_json);

  await clearCmsTables();

  if (snapshot.siteSettings.length > 0) {
    const { error } = await admin.from("site_settings").insert(snapshot.siteSettings);
    if (error) {
      throw new Error(`Failed restoring site_settings: ${error.message}`);
    }
  }

  if (snapshot.projects.length > 0) {
    const { error } = await admin.from("projects").insert(snapshot.projects);
    if (error) {
      throw new Error(`Failed restoring projects: ${error.message}`);
    }
  }

  if (snapshot.siteSections.length > 0) {
    const { error } = await admin.from("site_sections").insert(snapshot.siteSections);
    if (error) {
      throw new Error(`Failed restoring site_sections: ${error.message}`);
    }
  }

  if (snapshot.projectMedia.length > 0) {
    const { error } = await admin.from("project_media").insert(snapshot.projectMedia);
    if (error) {
      throw new Error(`Failed restoring project_media: ${error.message}`);
    }
  }

  const revalidateSlugs = snapshot.projects
    .filter((project) => project.status === "published")
    .map((project) => project.slug);

  return {
    release,
    restoredSectionCount: snapshot.siteSections.length,
    restoredProjectCount: snapshot.projects.length,
    restoredMediaCount: snapshot.projectMedia.length,
    revalidateSlugs,
  };
}
