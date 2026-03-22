import { notFound } from "next/navigation";

import { ProjectEditor } from "@/components/admin/ProjectEditor";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { getProjectById } from "@/src/lib/domain/projects";

type AdminProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProjectDetailPage({
  params,
}: AdminProjectDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireEditorPage();

  const [project, mediaResult] = await Promise.all([
    getProjectById(id, { includeMedia: false }, supabase),
    supabase
      .from("project_media")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectEditor
      projectId={id}
      initialProject={project}
      initialMedia={mediaResult.data ?? []}
    />
  );
}
